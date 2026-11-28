/** Restricted RFC6455 text WebSocket transport for local Sprint 02A. No compression/binary.
 * Production deployment should substitute a maintained WebSocket server library. */
import {createHash} from 'node:crypto';
import type {IncomingMessage} from 'node:http';
import type {Socket} from 'node:net';
import {TextDecoder} from 'node:util';
const LIMIT=64*1024;
function sendFrame(socket:Socket,opcode:number,payload:Uint8Array){
 if(socket.destroyed)return;
 const n=payload.length;const head=n<126?2:n<65536?4:10;
 const buf=Buffer.allocUnsafe(head+n);buf[0]=0x80|opcode;
 if(n<126){buf[1]=n;buf.set(payload,2);}else if(n<65536){buf[1]=126;buf.writeUInt16BE(n,2);buf.set(payload,4);}else{buf[1]=127;buf.writeBigUInt64BE(BigInt(n),2);buf.set(payload,10);}
 socket.write(buf);
}
export class Peer {
 private buffer=Buffer.alloc(0);private fragments:Buffer[]=[];private fragmentSize=0;private fragmented=false;
 private open=true;private closed=false;
 constructor(private socket:Socket,private onText:(peer:Peer,text:string)=>void,private onClose:(peer:Peer)=>void){
  socket.on('data',(chunk:Buffer)=>this.feed(chunk));
  // Upgraded sockets may be half-open after a TCP FIN. Release presence on EOF,
  // even when the client disappeared without a WebSocket close frame.
  socket.on('end',()=>{this.cleanup();socket.destroy();});
  socket.on('close',()=>this.cleanup()); socket.on('error',()=>this.cleanup());
 }
 send(message:unknown){if(this.open)sendFrame(this.socket,1,Buffer.from(JSON.stringify(message),'utf8'));}
 close(code=1000){if(!this.open)return;this.open=false;const b=Buffer.alloc(2);b.writeUInt16BE(code);sendFrame(this.socket,8,b);this.socket.end();this.cleanup();}
 start(head:Buffer){if(head?.length)this.feed(head);}
 private cleanup(){if(!this.closed){this.closed=true;this.open=false;this.onClose(this);}}
 private fail(){this.close(1002);}
 private feed(data:Buffer){if(!this.open)return;
  this.buffer=Buffer.concat([this.buffer,data]);if(this.buffer.length>LIMIT*2+64){this.close(1009);return;}
  while(this.buffer.length>=2){
   const b=this.buffer;const fin=!!(b[0]&0x80);const opcode=b[0]&15;
   if(b[0]&0x70){this.fail();return;}
   if(!(b[1]&0x80)){this.fail();return;}
   let length=b[1]&0x7f,header=2;
   if(length===126){if(b.length<4)return;length=b.readUInt16BE(2);header=4;}
   if(length===127){if(b.length<10)return;const num=b.readBigUInt64BE(2);if(num>BigInt(LIMIT)){this.close(1009);return;}length=Number(num);header=10;}
   if(length>LIMIT||this.fragmentSize+length>LIMIT){this.close(1009);return;}
   if(b.length<header+4+length)return;
   const key=b.subarray(header,header+4);const payload=Buffer.from(b.subarray(header+4,header+4+length));
   for(let i=0;i<payload.length;i++)payload[i]^=key[i%4]!;
   this.buffer=b.subarray(header+4+length);
   if(opcode>=8){if(!fin||length>125){this.fail();return;}if(opcode===8){this.close();return;}if(opcode===9)sendFrame(this.socket,10,payload);else if(opcode!==10){this.fail();return;}continue;}
   if(opcode===1){if(this.fragmented){this.fail();return;}this.fragments=[payload];this.fragmentSize=payload.length;this.fragmented=!fin;}
   else if(opcode===0){if(!this.fragmented){this.fail();return;}this.fragments.push(payload);this.fragmentSize+=payload.length;this.fragmented=!fin;}
   else {this.close(1003);return;}
   if(fin){const full=Buffer.concat(this.fragments);this.fragments=[];this.fragmentSize=0;
    try{this.onText(this,new TextDecoder('utf-8',{fatal:true}).decode(full));}catch{this.close(1007);return;}
   }
  }
 }
}
export function acceptWebSocket(req:IncomingMessage,socket:Socket,head:Buffer,onText:(peer:Peer,text:string)=>void,onClose:(peer:Peer)=>void):Peer|undefined{
 const key=req.headers['sec-websocket-key'];const version=req.headers['sec-websocket-version'];
 if(req.headers.upgrade?.toLowerCase()!=='websocket'||version!=='13'||typeof key!=='string'||!(/^[A-Za-z0-9+/]{22}==$/.test(key))) {
  socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');socket.destroy();return;
 }
 const accept=createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
 socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
 const peer=new Peer(socket,onText,onClose);peer.start(head);return peer;
}

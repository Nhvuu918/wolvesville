import {assertLobby,LobbyError} from '../multiplayer/types.js';
export async function processMedia(body:any){
 assertLobby(body.slot==='avatar'||body.slot==='cover'||body.slot==='post','MEDIA_SLOT','Invalid image slot');
 assertLobby(typeof body.data==='string'&&body.data.length<=2800000&&/^[A-Za-z0-9+/]+={0,2}$/.test(body.data),'MEDIA_INVALID','Invalid image data');
 const input=Buffer.from(body.data,'base64');assertLobby(input.length<=2*1024*1024&&input.length>0,'MEDIA_SIZE','Maximum 2 MiB',413);
 const png=input.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpeg=input[0]===255&&input[1]===216&&input[2]===255,webp=input.subarray(0,4).toString()==='RIFF'&&input.subarray(8,12).toString()==='WEBP';
 assertLobby((png&&body.mime==='image/png')||(jpeg&&body.mime==='image/jpeg')||(webp&&body.mime==='image/webp'),'MEDIA_TYPE','Only PNG, JPEG, WebP supported',415);
 const lib='sharp';let sharp:any;try{sharp=(await import(lib)).default;}catch{throw new LobbyError('MEDIA_UNAVAILABLE','Install sharp to enable media uploads',503);}
 const positions=['centre','north','south','east','west'];const position=positions.includes(body.position)?body.position:'centre';
 try{const image=sharp(input,{limitInputPixels:16_000_000,failOn:'error',animated:false});const meta=await image.metadata();assertLobby(meta.width&&meta.height&&meta.width<=4096&&meta.height<=4096&&(meta.pages??1)===1&&['png','jpeg','webp'].includes(meta.format),'MEDIA_DIMENSIONS','Invalid image dimensions');const resized=body.slot==='post'?image.rotate().resize(1200,1200,{fit:'inside',withoutEnlargement:true}):image.rotate().resize(body.slot==='avatar'?384:1200,body.slot==='avatar'?384:400,{fit:'cover',position});const output:Buffer=await resized.webp({quality:82}).toBuffer();assertLobby(output.length<=600000,'MEDIA_SIZE','Encoded image too large',413);return {slot:body.slot as 'avatar'|'cover'|'post',webp:output.toString('base64')};}catch(e){if(e instanceof LobbyError)throw e;throw new LobbyError('MEDIA_INVALID','Unable to decode image',415);}
}

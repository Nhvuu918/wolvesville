import {createHmac} from 'node:crypto';
import {KernelError,invariant} from '../common/errors.js';
import type {RandomRecord} from '../../../shared/contracts/index.js';

// Domain-separated HMAC and rejection sampling, independent from the order of HTTP arrival.
// The seed stays server-side and is never exposed in player projections.
function byteAt(seed:string,gameId:string,drawIndex:number,retry:number):number {
  const input=`wolvesville:v1|${gameId}|${drawIndex}|${retry}`;
  const digest=createHmac('sha256',seed).update(input).digest();
  return ((digest[0]<<24)>>>0)+(digest[1]<<16)+(digest[2]<<8)+digest[3];
}
export function deterministicIndex(seed:string,gameId:string,drawIndex:number,size:number):number {
  invariant(Number.isSafeInteger(size)&&size>0&&size<=0xffffffff,'RNG_DOMAIN_EMPTY','Candidate domain must not be empty');
  const range=4294967296;
  const cutoff=range-(range%size);
  for(let retry=0;retry<1000;retry++){
    const value=byteAt(seed,gameId,drawIndex,retry);
    if(value<cutoff)return value%size;
  }
  throw new KernelError('RULE_UNRESOLVED','RNG rejection sampling exhausted');
}
export function draw(seed:string,gameId:string,drawIndex:number,candidates:string[],reason:string,correlationId:string):RandomRecord {
  const sorted=[...candidates].sort();
  invariant(new Set(sorted).size===sorted.length,'INVALID_ARGUMENT','RNG candidates must be unique');
  if(sorted.length===0)throw new KernelError('RULE_UNRESOLVED','RNG domain empty; no fallback is permitted by Q13-06');
  const ix=deterministicIndex(seed,gameId,drawIndex,sorted.length);
  return {drawIndex,domain:sorted,result:sorted[ix],algorithm:'HMAC-SHA256-v1',reason,correlationId};
}
export function verifyDraw(seed:string,gameId:string,record:RandomRecord):boolean {
  if(record.algorithm!=='HMAC-SHA256-v1')return false;
  if(record.domain.length===0||new Set(record.domain).size!==record.domain.length)return false;
  if(JSON.stringify([...record.domain].sort())!==JSON.stringify(record.domain))return false;
  return record.domain[deterministicIndex(seed,gameId,record.drawIndex,record.domain.length)]===record.result;
}

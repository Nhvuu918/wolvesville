import { createHash } from 'node:crypto';
export function canonical(input: unknown): string {
  if(input===null || typeof input!=='object') return JSON.stringify(input);
  if(Array.isArray(input)) return '['+input.map(canonical).join(',')+']';
  const o=input as Record<string,unknown>;
  return '{'+Object.keys(o).sort().filter(k=>o[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';
}
export function hash(input: unknown): string {
  return createHash('sha256').update(typeof input==='string'?input:canonical(input)).digest('hex');
}
export function clone<T>(data:T):T {return JSON.parse(JSON.stringify(data)) as T;}

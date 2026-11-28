declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...values: unknown[]): {changes: number; lastInsertRowid: number | bigint};
      get(...values: unknown[]): any;
      all(...values: unknown[]): any[];
    };
    close(): void;
  }
}
declare module 'node:crypto' {
  export function randomUUID(): string;
  export function randomBytes(size: number): {toString(encoding: string): string};
  export function createHash(algorithm: string): {update(data: string|Uint8Array): any; digest(encoding: string): string};
  export function createHmac(algorithm: string,key: string): {update(data: string): any; digest(): Uint8Array};
}
declare module 'node:fs' {
  export function readFileSync(file: string,encoding?: string): any;
  export function mkdirSync(file: string,options?: {recursive?: boolean}): any;
}
declare module 'node:path' {
  export function dirname(file: string): string;
  export function resolve(...paths: string[]): string;
}
declare const process: { env: Record<string,string|undefined>; cwd(): string };

declare module 'node:url' { export function fileURLToPath(url: URL): string; }

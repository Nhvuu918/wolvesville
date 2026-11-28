import {existsSync} from 'node:fs';
// Local development only; OS-exported variables always have precedence.
export function loadLocalEnv(){
 if(existsSync('.env')&&typeof process.loadEnvFile==='function')process.loadEnvFile('.env');
 return process.env;
}
export function requireDatabaseUrl(){
 loadLocalEnv();const value=process.env.DATABASE_URL;
 if(!value)throw new Error('DATABASE_URL missing: copy .env.example to .env and set credentials for your existing PostgreSQL container. Nothing has been modified.');
 try{
  const parsed=new URL(value);
  if(!['postgres:','postgresql:'].includes(parsed.protocol)||!parsed.hostname||!parsed.pathname||!parsed.username||!parsed.password)throw Error();
  if(/YOUR_PASSWORD|CHANGE_ME|PLACEHOLDER|<|>/i.test(value))throw Error();
 }catch{throw new Error('DATABASE_URL invalid or contains an example placeholder. Configure the existing server credentials; no migration attempted.');}
 return value;
}
export function pgDiagnostic(error){
 const code=error&&typeof error==='object'&&'code' in error?String(error.code):'';
 if(code==='28P01')return 'PostgreSQL authentication failed (28P01). Check DATABASE_URL against the existing container; no password is logged and no reset is performed.';
 if(code==='3D000')return 'PostgreSQL database does not exist (3D000). Check your existing database name; no database was created.';
 if(code==='ECONNREFUSED')return 'PostgreSQL connection refused. Confirm Docker daemon and the existing PostgreSQL container are running.';
 return `PostgreSQL connection/migration failed (${code||'UNKNOWN'}). Credentials are not printed.`;
}

export function startupConfig(){
 loadLocalEnv();
 const provider=(process.env.DB_PROVIDER||'sqlite').trim().toLowerCase();
 if(!['sqlite','postgres'].includes(provider))throw new Error('DB_PROVIDER không hợp lệ. Hãy chọn sqlite hoặc postgres trong .env.');
 const port=Number(process.env.PORT||3212);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT phải là số nguyên từ 1 đến 65535.');
 return {provider,port,host:process.env.HOST||'127.0.0.1',databaseUrl:provider==='postgres'?requireDatabaseUrl():null};
}

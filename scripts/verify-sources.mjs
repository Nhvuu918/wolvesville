import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const read=(p)=>readFileSync(p);
const hash=(bytes)=>createHash('sha256').update(bytes).digest('hex');
const chars=read('data/character.json');
const roles=JSON.parse(chars.toString('utf8'));
if(roles.length!==97||new Set(roles.map(r=>r.id)).size!==97)throw new Error('97 character registry mismatch');
if(hash(chars)!=='7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3')throw new Error('Original character.json checksum mismatch');
const rules=JSON.parse(read('data/rules/official_merged_118.json'));
if(rules.length!==118||new Set(rules.map(r=>r.code)).size!==118)throw new Error('118 decisions mismatch');
if(JSON.parse(read('data/rules/tests_207.json')).length!==207)throw new Error('207 source test specs mismatch');
const frontend=JSON.parse(read('docs/APPROVED_FRONTEND_MANIFEST.json'));
const allowedTechnicalOverrides=new Set(['index.html','app.js']);
let unchanged=0,adapted=0;
for(const f of frontend.files){
 const path=join('frontend',f.path);
 if(!existsSync(path))throw new Error(`Approved UI asset missing: ${f.path}`);
 if(hash(read(path))===f.sha256){unchanged++;continue;}
 if(!allowedTechnicalOverrides.has(f.path))throw new Error(`Approved UI design/asset modified: ${f.path}`);
 const original=join('reference/approved_frontend_original',f.path);
 if(!existsSync(original)||hash(read(original))!==f.sha256)throw new Error(`Original UI backup missing or mismatched: ${f.path}`);
 adapted++;
}
// All originals are archived as a forensic source of truth, including modified technical files.
for(const f of frontend.files){
 const original=join('reference/approved_frontend_original',f.path);
 if(!existsSync(original)||hash(read(original))!==f.sha256)throw new Error(`Original UI preservation failed: ${f.path}`);
}
if(adapted!==2)throw new Error(`Expected exactly two approved technical entrypoint changes, got ${adapted}`);
for(const file of ['frontend/integration.js','frontend/integration.css'])if(!existsSync(file))throw new Error('Missing Sprint03 integration module: '+file);
console.log(`OK: ${roles.length} official characters, ${rules.length} decisions, 207 inherited test specs, ${unchanged}/${frontend.files.length} unchanged approved frontend files, ${adapted} technical entrypoints adapted with original verified backups.`);

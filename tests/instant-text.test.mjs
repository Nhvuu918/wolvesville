/** Sprint03 static regression: no character-by-character text updates in approved stage adaptation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../frontend/app.js',import.meta.url),'utf8');
const integration=readFileSync(new URL('../frontend/integration.js',import.meta.url),'utf8');
const styles=readFileSync(new URL('../frontend/style.css',import.meta.url),'utf8');

test('Sprint03 stage dialogue renders all text synchronously without typewriter loops',()=>{
 const stage=app.match(/function runTypewriter\(text\)\s*\{([\s\S]*?)\n\}/);
 assert.ok(stage,'existing stage function preserved');
 assert.match(stage[1],/\.textContent\s*=\s*String\(text\s*\?\?\s*''\)/);
 assert.doesNotMatch(stage[1],/setInterval|setTimeout|\.slice\(|\.substring\(|\.charAt\(|requestAnimationFrame/);
});

test('Sprint03 approved stage typography has no per-character animation or clipping',()=>{
 const rule=styles.match(/\.dialogue-typewriter\s*\{([^}]*)\}/);
 assert.ok(rule,'approved stage selector preserved');
 assert.doesNotMatch(rule[1],/animation|steps\(|overflow\s*:\s*hidden|width\s*:\s*0/);
 assert.doesNotMatch(styles,/@keyframes\s+(typewriter|typing)\b/i);
});

test('Sprint03 skill feedback renders a completed server-issued message in one DOM update',()=>{
 assert.match(integration,/renderFeedback\(\)\s*\{/);
 assert.match(integration,/box\.innerHTML\s*=/);
 const method=integration.split('renderFeedback(){')[1]?.split('async verifyReplay()')[0];
 assert.ok(method);
 assert.doesNotMatch(method,/setInterval|setTimeout|\.charAt\(|\.slice\(0\s*,/);
 assert.match(method,/resolutionStatus\s*===\s*'RESOLVED'/);
});

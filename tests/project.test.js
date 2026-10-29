import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, validateProject, serializeProject, makePost, makeAlt, readProject } from '../src/project.js';

test('portable project preserves text, chosen diff, and validated image data', () => {
  const original = { ...createProject(), before: { dataUrl:'data:image/png;base64,aGVsbG8=',mime:'image/png',name:'before.png' } };
  assert.deepEqual(validateProject(JSON.parse(serializeProject(original))), original);
});
test('reject unsupported versions and corrupt settings', () => {
  assert.throws(()=>validateProject({...createProject(),version:2}), /version/);
  assert.throws(()=>validateProject({...createProject(),layout:'unknown'}), /layout/);
  assert.throws(()=>validateProject({...createProject(),hunkIndex:-1}), /index/);
});
test('image records cannot load remote, executable, or oversized content', () => {
  for (const dataUrl of ['https://example.com/x.png','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,!!!!']) {
    assert.throws(()=>validateProject({...createProject(),before:{dataUrl,mime:'image/png',name:'x'}}));
  }
  assert.throws(()=>validateProject({...createProject(),before:{dataUrl:'data:image/png;base64,'+'a'.repeat(7_000_000),mime:'image/png',name:'x'}}),/5 MB/);
});
test('reject script URL and credentials; preserve optional empty link', () => {
  assert.throws(()=>validateProject({...createProject(),repository:'javascript:alert(1)'}),/http/);
  assert.throws(()=>validateProject({...createProject(),repository:'https://token@example.com/x'}),/credentials/);
  assert.equal(validateProject({...createProject(),repository:''}).repository,'');
});
test('copy drafts reflect author-entered content without invented claims', () => {
  const p={...createProject(),title:'A real improvement',subtitle:'The measured result is in my report.'};
  assert.equal(makePost(p),'A real improvement\n\nThe measured result is in my report.\n\nhttps://github.com/kunkun-11/tiny-source-lab');
  assert.match(makeAlt(p),/Selected code-diff excerpt/);
  assert.doesNotMatch(makeAlt(p),/before and after screenshots supplied/i);
});
test('image descriptions state missing diffs, hidden context, and actual clipping notes', () => {
  assert.match(makeAlt({...createProject(),diff:''}),/No valid text-diff/);
  const alt = makeAlt({...createProject(),showContext:false},{warnings:['Two lines not shown.']});
  assert.match(alt,/Unchanged context lines are hidden/);
  assert.match(alt,/Two lines not shown/);
  assert.match(makeAlt(createProject(),{lang:'zh'}),/更新展示卡片/);
});
test('import gives specific JSON and size diagnostics', async () => {
  await assert.rejects(()=>readProject({size:10,text:async()=>'{broken'}),/JSON/);
  await assert.rejects(()=>readProject({size:20*1024*1024,text:async()=>''}),/16 MB/);
  assert.deepEqual(await readProject({size:1000,text:async()=>serializeProject(createProject())}),createProject());
});

import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { createProject } from '../../src/project.js';

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#title')).toHaveValue('One small snapshot. No lost listeners.');
  await expect(page.locator('#export-png')).toBeEnabled();
}
async function png(page) {
  await expect(page.locator('#export-png')).toBeEnabled();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-png').click();
  const download = await downloadPromise;
  return fs.readFile(await download.path());
}

test('real example exports the exact preview pixels in both formats', async ({ page }) => {
  await ready(page);
  const before = await page.locator('#card-canvas').evaluate(c => c.toDataURL('image/png'));
  const bytes = await png(page);
  expect(bytes.readUInt32BE(16)).toBe(1600);
  expect(bytes.readUInt32BE(20)).toBe(1000);
  expect(bytes.toString('base64')).toBe(before.split(',')[1]);
  await page.locator('#format-square').click();
  await page.locator('#theme-light').click();
  await expect(page.locator('#dimensions')).toContainText('1200 × 1200');
  const square = await png(page);
  expect(square.readUInt32BE(16)).toBe(1200);
  expect(square.readUInt32BE(20)).toBe(1200);
});

test('project download includes images and restores the editable result', async ({ page }) => {
  await ready(page);
  await page.locator('#title').fill('A useful release');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#save-project').click();
  const download = await downloadPromise;
  const content = await fs.readFile(await download.path());
  const saved = JSON.parse(content);
  expect(saved.title).toBe('A useful release');
  expect(saved.before.dataUrl).toMatch(/^data:image\/png;base64,/);
  expect(saved.after.dataUrl).toMatch(/^data:image\/png;base64,/);
  page.once('dialog', d => d.accept());
  await page.locator('#start-fresh').click();
  await page.locator('#import-project').setInputFiles({name:'project.json',mimeType:'application/json',buffer:content});
  await expect(page.locator('#status')).toContainText('Project opened');
  await expect(page.locator('#title')).toHaveValue('A useful release');
  await expect(page.locator('.image-slot img')).toHaveCount(2);
  await png(page);
});

test('multiple files and hunks are selectable and source is treated as text', async ({ page }) => {
  await ready(page);
  const patch = '--- a/one.js\n+++ b/one.js\n@@ -1 +1 @@\n-old\n+new\n@@ -8 +8 @@\n-second\n+next\n--- a/<img src=x>.js\n+++ b/<img src=x>.js\n@@ -1 +1 @@\n-a\n+b\n';
  await page.locator('#layout-code').click();
  await page.locator('#diff-input').fill(patch);
  await expect(page.locator('#file-select option')).toHaveCount(2);
  await expect(page.locator('#hunk-select option')).toHaveCount(2);
  await page.locator('#hunk-select').selectOption('1');
  await expect(page.locator('#card-canvas')).toHaveAttribute('aria-label',/@@ -8 \+8 @@/);
  await page.locator('#file-select').selectOption('1');
  await expect(page.locator('#hunk-select option')).toHaveCount(1);
  await expect(page.locator('#card-canvas')).toHaveAttribute('aria-label',/<img src=x>\.js/);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

test('malformed and binary diffs block code export; screenshot comparison remains usable', async ({ page }) => {
  await ready(page);
  await page.locator('#layout-code').click();
  await page.locator('#diff-input').fill('--- a/x\n+++ b/x\n@@ -1,2 +1 @@\n-old\n+new\n');
  await expect(page.locator('#warnings')).toContainText('mismatch');
  await page.locator('#export-png').click();
  await expect(page.locator('#status')).toContainText('No text section');
  await page.locator('#diff-input').fill('diff --git a/x.png b/x.png\nBinary files a/x.png and b/x.png differ\n');
  await expect(page.locator('#warnings')).toContainText('Binary');
  await page.locator('#export-png').click();
  await expect(page.locator('#status')).toContainText('No text section');
  await page.locator('#layout-compare').click();
  await png(page);
  await expect(page.locator('#card-canvas')).toHaveAttribute('aria-label',/Before and after screenshots/);
});

test('incomplete URLs give diagnostics without errors or stale export', async ({ page }) => {
  await ready(page);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.locator('#repository').fill('https://');
  await page.locator('#copy-post').click();
  await expect(page.locator('#status')).toContainText('http(s)');
  await page.locator('#export-png').click();
  await expect(page.locator('#status')).toContainText('http(s)');
  expect(errors).toEqual([]);
  await page.locator('#repository').fill('https://github.com/kunkun-11/patchstage');
  await png(page);
});

test('language, mobile layout, and metadata persistence work', async ({ page }) => {
  await ready(page);
  await page.locator('#language').click();
  await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');
  await expect(page.locator('#export-png')).toContainText('下载');
  await expect(page.locator('#card-canvas')).toHaveAttribute('aria-label',/更新展示卡片/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator('#title').fill('一个真实的更新');
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator('#title')).toHaveValue('一个真实的更新');
  await expect(page.locator('html')).toHaveAttribute('lang','zh-CN');
  // Full images are saved in portable JSON, metadata-only browser persistence is explicit.
  await expect(page.locator('.image-slot img')).toHaveCount(0);
});

test('invalid image and project imports leave the current project usable', async ({ page }) => {
  await ready(page);
  await page.locator('#before-input').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await expect(page.locator('#status')).toContainText('decoded');
  await page.locator('#import-project').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
  await expect(page.locator('#status')).toContainText('JSON');
  const bad = {...createProject(),before:{dataUrl:'data:image/png;base64,aGVsbG8=',mime:'image/png',name:'bad.png'}};
  await page.locator('#import-project').setInputFiles({name:'bad-image.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
  await expect(page.locator('#status')).toContainText('decoded');
  await expect(page.locator('#title')).toHaveValue('One small snapshot. No lost listeners.');
  await png(page);
});

test('clipping and hidden context are disclosed in the image description', async ({ page }) => {
  await ready(page);
  await page.locator('#layout-code').click();
  await page.locator('#show-context').check();
  const patch = '--- a/long.js\n+++ b/long.js\n@@ -1,40 +1,40 @@\n' + Array.from({length:40},(_,i)=>' line '+i+'\n').join('');
  await page.locator('#diff-input').fill(patch);
  await expect(page.locator('#warnings')).toContainText('not shown');
  await expect(page.locator('#card-canvas')).toHaveAttribute('aria-label',/omissions are labeled/);
  await page.locator('#show-context').uncheck();
  await expect(page.locator('#card-canvas')).toHaveAttribute('aria-label',/context lines are hidden/);
});

test('disabled browser storage is handled without crashing', async ({ page }) => {
  await page.addInitScript(()=>{ Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled');}}); });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ready(page);
  await page.locator('#title').fill('Works in this tab');
  await png(page);
  expect(errors).toEqual([]);
});

test('edits made during slow example loading are preserved', async ({ page }) => {
  await ready(page);
  await page.route('**/samples/**', async route => { await new Promise(resolve => setTimeout(resolve, 700)); await route.continue(); });
  await page.locator('#load-demo').click();
  await page.locator('#title').fill('Keep this new edit');
  await expect(page.locator('#status')).toContainText('edits were kept', {timeout:10000});
  await expect(page.locator('#title')).toHaveValue('Keep this new edit');
});

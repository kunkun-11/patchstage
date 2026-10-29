import { parseDiff } from './diff.js';

const IMAGE_LIMIT = 5 * 1024 * 1024;
const PROJECT_LIMIT = 16 * 1024 * 1024;
const MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const options = {
  accent: ['lime', 'violet', 'blue'], theme: ['dark', 'light'],
  format: ['wide', 'square'], layout: ['code', 'compare', 'story'],
};
const BASIC_DIFF = '--- a/example.js\n+++ b/example.js\n@@ -1 +1 @@\n-handlers.forEach(fn => fn(event));\n+handlers.slice().forEach(fn => fn(event));\n';

export function createProject() {
  return {
    version: 1, title: 'Keep every listener in the loop.',
    subtitle: 'A tiny snapshot preserves this round of event dispatch.',
    repository: 'https://github.com/kunkun-11/tiny-source-lab',
    accent: 'lime', theme: 'dark', format: 'wide', layout: 'code',
    showContext: true, diff: BASIC_DIFF, fileIndex: 0, hunkIndex: 0,
    before: null, after: null,
  };
}

function text(value, key, max) {
  if (typeof value !== 'string') throw new Error(`${key} must be text.`);
  if (value.length > max) throw new Error(`${key} exceeds ${max} characters.`);
  return value;
}
function imageRecord(value, key) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${key} must be a local image.`);
  if (!MIME_TYPES.has(value.mime)) throw new Error(`${key}: use PNG, JPEG, or WebP.`);
  const match = typeof value.dataUrl === 'string' && value.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[1] !== value.mime || match[2].length % 4 !== 0) throw new Error(`${key}: invalid image data.`);
  if (Math.ceil(match[2].length * 3 / 4) > IMAGE_LIMIT + 2) throw new Error(`${key}: image exceeds 5 MB.`);
  return { dataUrl: value.dataUrl, mime: value.mime, name: text(value.name || 'image', `${key} name`, 255) };
}

export function validateProject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Choose a PatchStage project JSON file.');
  if (value.version !== 1) throw new Error('Unsupported project version. This release opens version 1.');
  const p = createProject();
  for (const [key, max] of [['title', 100], ['subtitle', 220], ['repository', 240], ['diff', 2 * 1024 * 1024]]) {
    p[key] = text(value[key], key, max);
  }
  if (p.repository.trim()) {
    let url;
    try { url = new URL(p.repository.trim()); } catch { throw new Error('Repository must be an http(s) URL or left empty.'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Repository must be an http(s) URL without credentials.');
    p.repository = url.href;
  }
  for (const [key, allowed] of Object.entries(options)) {
    if (!allowed.includes(value[key])) throw new Error(`Unknown ${key} option.`);
    p[key] = value[key];
  }
  if (typeof value.showContext !== 'boolean') throw new Error('showContext must be true or false.');
  p.showContext = value.showContext;
  for (const key of ['fileIndex', 'hunkIndex']) {
    if (!Number.isSafeInteger(value[key]) || value[key] < 0 || value[key] > 30000) throw new Error(`${key} must be a non-negative index.`);
    p[key] = value[key];
  }
  p.before = imageRecord(value.before, 'Before');
  p.after = imageRecord(value.after, 'After');
  return p;
}

export function serializeProject(project) {
  return JSON.stringify(validateProject(project), null, 2);
}

function dataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsDataURL(blob);
  });
}

async function decodeImage(src) {
  await new Promise((resolve, reject) => {
    const probe = new Image();
    probe.onload = () => {
      if (!probe.naturalWidth || !probe.naturalHeight || probe.naturalWidth * probe.naturalHeight > 40_000_000) reject(new Error('Image is empty or exceeds 40 million pixels.'));
      else resolve();
    };
    probe.onerror = () => reject(new Error('This file could not be decoded as an image.'));
    probe.src = src;
  });
}

export async function readImage(file) {
  if (!file || !MIME_TYPES.has(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.');
  if (file.size > IMAGE_LIMIT) throw new Error('Images must be 5 MB or smaller.');
  const src = await dataUrl(file);
  await decodeImage(src);
  return { dataUrl: src, mime: file.type, name: file.name };
}

export async function readProject(file) {
  if (!file || file.size > PROJECT_LIMIT) throw new Error('Project file must be 16 MB or smaller.');
  let value;
  try { value = JSON.parse(await file.text()); } catch { throw new Error('This file is not valid JSON.'); }
  const project = validateProject(value);
  for (const key of ['before', 'after']) {
    if (project[key]) await decodeImage(project[key].dataUrl);
  }
  return project;
}

export function makePost(project) {
  const p = validateProject(project);
  return [p.title.trim(), p.subtitle.trim(), p.repository.trim()].filter(Boolean).join('\n\n');
}

export function makeAlt(project, { warnings = [], lang = project.lang || 'en' } = {}) {
  const p = validateProject(project);
  const zh = lang === 'zh';
  const parts = [zh ? `更新展示卡片：${p.title.trim() || '未命名改动'}。` : `Release card: ${p.title.trim() || 'Untitled change'}.`];
  if (p.subtitle.trim()) parts.push(p.subtitle.trim());
  if (p.layout !== 'compare') {
    let file, hunk;
    try { file = parseDiff(p.diff).files[p.fileIndex]; hunk = file?.hunks[p.hunkIndex]; } catch { /* A draft can be copied while its diff is incomplete. */ }
    if (hunk) {
      const added = hunk.lines.filter(row => row.type === 'add').length;
      const removed = hunk.lines.filter(row => row.type === 'remove').length;
      parts.push(zh ? `${file.path} 的选定差异片段 ${hunk.header}：${added} 行增加，${removed} 行删除。显示修改前后的行号；绿色表示增加，红色表示删除。` : `Selected code-diff excerpt from ${file.path}, ${hunk.header}: ${added} added and ${removed} removed lines. Shows old and new line numbers; green additions and red removals.`);
      if (!p.showContext) parts.push(zh ? '未改变的上下文行已隐藏。' : 'Unchanged context lines are hidden.');
      if (hunk.lines.some(row => row.type === 'meta')) parts.push(zh ? '原始片段带有文件末尾无换行标记。' : 'The source hunk includes a no-newline-at-end marker.');
    } else parts.push(zh ? '当前没有可显示的有效代码片段。' : 'No valid text-diff excerpt is currently selected.');
  }
  if (p.layout !== 'code') {
    parts.push(p.before && p.after ? (zh ? `作者提供的前后截图（${p.before.name}；${p.after.name}）。` : `Before and after screenshots supplied by the author (${p.before.name}; ${p.after.name}).`) : (zh ? '尚未同时提供前后截图。' : 'Screenshot slots have not both been supplied.'));
  }
  if (warnings.length) parts.push((zh ? '卡片提示：' : 'Card notes: ') + [...new Set(warnings)].join(' '));
  if (p.repository.trim()) parts.push(`${zh ? '来源：' : 'Source: '}${p.repository.trim()}`);
  return parts.join(' ');
}

export async function loadDemo() {
  const root = `${import.meta.env?.BASE_URL || '/'}samples/`;
  const [diffResponse, beforeResponse, afterResponse] = await Promise.all([
    fetch(`${root}source-lab.diff`), fetch(`${root}before.png`), fetch(`${root}after.png`),
  ]);
  if (![diffResponse, beforeResponse, afterResponse].every(r => r.ok)) throw new Error('The sample files could not be loaded. Try again or paste your own diff.');
  const [diff, before, after] = await Promise.all([diffResponse.text(), beforeResponse.blob(), afterResponse.blob()]);
  return validateProject({
    ...createProject(), title: 'One small snapshot. No lost listeners.',
    subtitle: 'Source Lab teaching repair: self-removal now preserves the next listener, including wildcard dispatch.',
    diff, fileIndex: 0, hunkIndex: 1, layout: 'story', showContext: false,
    before: { dataUrl: await dataUrl(before), mime: 'image/png', name: 'Source Lab starter (teaching defect)' },
    after: { dataUrl: await dataUrl(after), mime: 'image/png', name: 'Source Lab reference (checks pass)' },
  });
}

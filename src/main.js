import './style.css';
import { parseDiff } from './diff.js';
import { createProject, validateProject, readImage, readProject, serializeProject, makePost, makeAlt, loadDemo } from './project.js';
import { renderCard } from './card.js';

const REPO = 'https://github.com/kunkun-11/patchstage';
const KEY = 'patchstage:v1';
const app = document.querySelector('#app');
let project = createProject();
let lang = 'en';
let storageAvailable = true;
let restored = false;
try {
  lang = localStorage.getItem('patchstage:language') === 'zh' ? 'zh' : 'en';
  const previous = localStorage.getItem(KEY);
  if (previous) { project = validateProject(JSON.parse(previous)); restored = true; }
} catch { storageAvailable = false; }
let parsed = { files: [], warnings: [] };
let parseError = '';
let status = '';
let visualWarnings = [];
let repaintVersion = 0;
let painting = false;
let renderError = '';
let downloading = false;
let dirty = false;
let changeVersion = 0;
const imageVersions = { before: 0, after: 0 };
let saveTimer;

const translations = {
  en: {
    tagline: 'Give your next release a stage.', github: 'GitHub', lang: 'Switch to Chinese',
    eyebrow: 'A SMALL WORKSHOP FOR YOUR NEXT BIG UPDATE', title: 'You made a change.', titleSecond: 'Make it easy to see.', intro: 'Real code. Your screenshots. One release card worth sharing.',
    loadDemo: 'Load the example', loadDemoConfirm: 'Replace this project with the example? Unsaved changes and images will be replaced.', loadInterrupted: 'Your new edits were kept. Load the example again to replace them.', openInterrupted: 'Your new edits were kept. Open the project again to replace them.',
    import: 'Open project', importConfirm: 'Open this saved project? Your current unsaved changes and images will be replaced.', save: 'Save project', download: 'Download PNG', downloading: 'Preparing PNG…',
    setup: 'THE STORY', metadata: 'What changed?', titleLabel: 'Release title', titlePlaceholder: 'A small fix. A smoother experience.',
    subtitleLabel: 'Why it matters', subtitlePlaceholder: 'What can people do better after this change?', repoLabel: 'Repository link', repoPlaceholder: 'https://github.com/you/project',
    design: 'THE LOOK', layout: 'Card layout', code: 'Code', compare: 'Compare', story: 'Story',
    codeDetail: 'Before / after code', compareDetail: 'Before / after images', storyDetail: 'Images + a code detail',
    format: 'Canvas shape', wide: 'Landscape', square: 'Square', theme: 'Card theme', dark: 'Dark', light: 'Light', accent: 'Accent color', lime: 'Lime', violet: 'Violet', blue: 'Blue',
    preview: 'LIVE PREVIEW', exportReady: 'Your card, ready to share.', rendered: 'Preview and download use the same card.',
    local: 'Your work stays in this browser.', localSub: 'Save a project to keep your images with it.', localMemory: 'Your work stays in this tab.',
    source: 'THE CHANGE', sourceTitle: 'Choose the part worth showing.', diffLabel: 'Paste a unified diff', diffPlaceholder: 'Paste the output of git diff here…', file: 'File', hunk: 'Change section', noFile: 'No text file found', noHunk: 'No text section found', showContext: 'Include unchanged lines',
    sourceHelp: 'Pick one clear change. Large sections are labeled when lines are omitted.',
    screenshotLabel: 'THE RESULT', screenshotTitle: 'Add your actual screenshots.', before: 'Before', after: 'After', addImage: 'Choose image', replaceImage: 'Replace image', remove: 'Remove',
    imageHelp: 'PNG, JPEG or WebP · up to 5 MB each. Images stay local.', noImage: 'No image added',
    share: 'WORDS TO GO WITH IT', shareTitle: 'Share the change, in your words.', post: 'Copy post draft', alt: 'Copy image description',
    shareHelp: 'A starting point for your post, and a useful description for people who cannot see the card.',
    copiedPost: 'Post draft copied. Edit it to suit your audience.', copiedAlt: 'Image description copied.', clipboardError: 'Clipboard unavailable. Select and copy the text below.',
    pngSaved: 'PNG downloaded.', projectSaved: 'Project saved with its images.', projectOpened: 'Project opened.', exampleLoaded: 'Example loaded: a real Tiny Source Lab teaching repair.',
    imageAdded: 'Image added.', imageRemoved: 'Image removed.', reset: 'Start fresh', resetConfirm: 'Start a new project? Your current changes and images will be replaced.',
    resetDone: 'New project ready.', noDiff: 'Paste a unified diff to show a code change. You can also choose Compare and add two screenshots.',
    brokenDiff: 'This diff could not be read. Check that it includes file headers and an @@ change section.',
    emptySelection: 'No text section is available. Use a text diff, or choose Compare for screenshots.',
    footer: 'A release deserves more than “fixed a bug”.', footerMeta: 'NO ACCOUNT · NO API KEY · OPEN SOURCE',
    warnings: 'Keep the card clear', rendering: 'Updating card…', imageNeeded: 'Add the missing screenshots, or switch to Code before downloading.',
    accessiblePreview: 'Release card preview', error: 'Something needs attention: ', chars: 'characters',
  },
  zh: {
    tagline: '给下一次更新一个舞台。', github: 'GitHub', lang: '切换为英文',
    eyebrow: '为你的下一次更新，准备一个小小的工作台', title: '你做了一个改动。', titleSecond: '让大家一眼看懂。', intro: '真实代码，你的截图，一张值得分享的发布卡片。',
    loadDemo: '载入示例', loadDemoConfirm: '用示例替换当前项目？尚未保存的修改与图片将被替换。', loadInterrupted: '已保留你刚刚的修改。如需替换，请重新载入示例。', openInterrupted: '已保留你刚刚的修改。如需替换，请重新打开项目。',
    import: '打开项目', importConfirm: '打开这个项目？当前尚未保存的修改和图片将被替换。', save: '保存项目', download: '下载 PNG', downloading: '正在生成 PNG…',
    setup: '讲清这次更新', metadata: '改了什么？', titleLabel: '发布标题', titlePlaceholder: '一个小修复，一次更顺畅的体验。',
    subtitleLabel: '对使用者有什么帮助', subtitlePlaceholder: '这次更新让大家能更好地做什么？', repoLabel: '仓库链接', repoPlaceholder: 'https://github.com/你/项目',
    design: '选择呈现方式', layout: '卡片版式', code: '代码', compare: '对照', story: '故事',
    codeDetail: '前后代码对照', compareDetail: '前后截图对照', storyDetail: '截图 + 关键代码',
    format: '画布比例', wide: '横版', square: '方形', theme: '卡片主题', dark: '深色', light: '浅色', accent: '强调色', lime: '青柠', violet: '紫色', blue: '蓝色',
    preview: '实时预览', exportReady: '做好卡片，就可以分享。', rendered: '预览的就是你下载的卡片。',
    local: '作品保存在当前浏览器。', localSub: '保存项目文件，才能一起保存图片。', localMemory: '作品仅保存在当前标签页。',
    source: '选择代码变更', sourceTitle: '挑出最值得展示的部分。', diffLabel: '粘贴统一差异（unified diff）', diffPlaceholder: '在这里粘贴 git diff 的输出…', file: '文件', hunk: '变更片段', noFile: '未找到文本文件', noHunk: '未找到文本片段', showContext: '展示未修改的上下文',
    sourceHelp: '选一个清晰的改动。过长的片段会明确标注省略行。',
    screenshotLabel: '展示实际效果', screenshotTitle: '添加你的真实截图。', before: '修改前', after: '修改后', addImage: '选择图片', replaceImage: '更换图片', remove: '移除',
    imageHelp: 'PNG、JPEG 或 WebP，每张最多 5 MB；图片保存在本地。', noImage: '尚未添加图片',
    share: '配上几句说明', shareTitle: '用你自己的话介绍这次更新。', post: '复制发布文案', alt: '复制图片描述',
    shareHelp: '给发布文案一个起点，也为看不到卡片的人提供有用的说明。',
    copiedPost: '发布草稿已复制，按你的受众调整后再发布。', copiedAlt: '图片描述已复制。', clipboardError: '剪贴板不可用，请选中并复制下方文本。',
    pngSaved: 'PNG 已下载。', projectSaved: '项目已保存，包含图片。', projectOpened: '项目已打开。', exampleLoaded: '示例已载入：Tiny Source Lab 的真实教学修复。',
    imageAdded: '图片已添加。', imageRemoved: '图片已移除。', reset: '新建项目', resetConfirm: '新建一个项目？当前修改与图片将被替换。',
    resetDone: '新项目已准备好。', noDiff: '粘贴统一差异来展示代码变更；也可以选择「对照」，添加两张截图。',
    brokenDiff: '无法读取此差异。请确认包含文件头和 @@ 变更片段。', emptySelection: '没有可用的文本片段。请使用文本差异，或选择「对照」展示截图。',
    footer: '一次更新，值得比「修了个 Bug」多一点的介绍。', footerMeta: '无需账号 · 无需 API KEY · 开源',
    warnings: '让卡片更清晰', rendering: '正在更新卡片…', imageNeeded: '先补齐截图，或切换为「代码」版式，再下载。',
    accessiblePreview: '发布卡片预览', error: '请留意：', chars: '字符',
  },
};
const t = key => translations[lang][key] || translations.en[key] || key;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icons = {
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>', external: '<path d="M14 4h6v6m0-6-9 9M10 4H4v16h16v-6"/>',
  code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14"/>', image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-5-5-7 8-3-3-3 4"/>',
  check: '<path d="m5 12 4 4L19 6"/>', warning: '<path d="m12 3 10 18H2zM12 9v5m0 3v1"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>', star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.code}</svg>`;

function parse() {
  parseError = '';
  try { parsed = parseDiff(project.diff); if (!parsed || !Array.isArray(parsed.files)) throw new Error(t('brokenDiff')); }
  catch (error) { parsed = { files: [], warnings: [] }; parseError = error.message || t('brokenDiff'); }
  project.fileIndex = Math.max(0, Math.min(project.fileIndex || 0, Math.max(0, parsed.files.length - 1)));
  const hunks = parsed.files[project.fileIndex]?.hunks || [];
  project.hunkIndex = Math.max(0, Math.min(project.hunkIndex || 0, Math.max(0, hunks.length - 1)));
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...project, before: null, after: null })); localStorage.setItem('patchstage:language', lang); }
  catch { storageAvailable = false; }
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); }
function say(message) { status = message; const node = document.querySelector('#status'); if (node) node.textContent = message; }
function changed() { dirty = true; changeVersion += 1; scheduleSave(); say(''); repaint(); }
function segment(group, values) {
  return `<div class="segments" role="group" aria-label="${t(group)}">${values.map(value => `<button type="button" id="${group}-${value}" data-group="${group}" data-value="${value}" class="segment ${project[group] === value ? 'selected' : ''}" aria-pressed="${project[group] === value}">${t(value)}</button>`).join('')}</div>`;
}
function imageSlot(which) {
  const image = project[which];
  return `<div class="image-slot ${image ? 'has-image' : ''}"><div class="image-slot-head"><strong>${t(which)}</strong>${image ? `<button type="button" class="text-button" id="remove-${which}">${t('remove')}</button>` : ''}</div><label class="image-picker" for="${which}-input">${image ? `<img src="${esc(image.dataUrl)}" alt="${t(which)}"/>` : `<span class="image-empty">${icon('image')}<span>${t('noImage')}</span></span>`}<span class="image-picker-action">${icon('plus')}${image ? t('replaceImage') : t('addImage')}</span></label><input type="file" class="file-input" id="${which}-input" accept="image/png,image/jpeg,image/webp"/>${image ? `<span class="image-filename">${esc(image.name)}</span>` : ''}</div>`;
}
function selectionMarkup() {
  const file = parsed.files[project.fileIndex];
  return `<div class="selection-row"><label>${t('file')}<select id="file-select" ${parsed.files.length ? '' : 'disabled'}>${parsed.files.length ? parsed.files.map((value, i) => `<option value="${i}" ${i === project.fileIndex ? 'selected' : ''}>${esc(value.path)}</option>`).join('') : `<option>${t('noFile')}</option>`}</select></label><label>${t('hunk')}<select id="hunk-select" ${file?.hunks?.length ? '' : 'disabled'}>${file?.hunks?.length ? file.hunks.map((value, i) => `<option value="${i}" ${i === project.hunkIndex ? 'selected' : ''}>${esc(value.header || `@@ ${value.oldStart} → ${value.newStart} @@`)}</option>`).join('') : `<option>${t('noHunk')}</option>`}</select></label></div>`;
}
function render() {
  parse();
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  app.innerHTML = `
    <header class="topbar"><a class="brand" href="${REPO}" target="_blank" rel="noreferrer"><span class="brand-mark">P<span></span></span><span>Patch<strong>Stage</strong><sup>β</sup></span></a><span class="brand-tagline">${t('tagline')}</span><div class="topbar-actions"><button id="language" class="language-button" aria-label="${t('lang')}">${lang === 'en' ? '中文' : 'EN'}</button><a href="${REPO}" target="_blank" rel="noreferrer">${t('github')} ${icon('external')}</a></div></header>
    <main>
      <section class="hero"><div><div class="eyebrow"><span></span>${t('eyebrow')}</div><h1>${t('title')}<br/><span>${t('titleSecond')}</span></h1><p>${t('intro')}</p></div><button id="load-demo" class="example-button">${icon('code')}<span>${t('loadDemo')}</span>${icon('arrow')}</button></section>
      <div id="status" class="status" role="status" aria-live="polite">${esc(status)}</div>
      <div class="studio">
        <aside class="controls-panel">
          <section class="control-section"><div class="section-number">01</div><span class="eyebrow">${t('setup')}</span><h2>${t('metadata')}</h2>
            <label class="field" for="title">${t('titleLabel')}<input id="title" type="text" maxlength="100" value="${esc(project.title)}" placeholder="${t('titlePlaceholder')}"/><span class="character-count" id="title-count">${project.title.length}/100</span></label>
            <label class="field" for="subtitle">${t('subtitleLabel')}<textarea id="subtitle" maxlength="220" rows="3" placeholder="${t('subtitlePlaceholder')}">${esc(project.subtitle)}</textarea><span class="character-count" id="subtitle-count">${project.subtitle.length}/220</span></label>
            <label class="field" for="repository">${t('repoLabel')}<input id="repository" type="url" maxlength="240" value="${esc(project.repository)}" placeholder="${t('repoPlaceholder')}"/></label>
          </section>
          <section class="control-section design-section"><div class="section-number">02</div><span class="eyebrow">${t('design')}</span><h2>${t('layout')}</h2><div class="layout-options">${['code', 'compare', 'story'].map(value => `<button id="layout-${value}" data-group="layout" data-value="${value}" class="layout-button ${project.layout === value ? 'selected' : ''}" aria-pressed="${project.layout === value}"><span class="layout-drawing ${value}"><i></i><i></i>${value === 'story' ? '<b></b>' : ''}</span><span>${t(value)}</span><span class="layout-detail">${t(`${value}Detail`)}</span></button>`).join('')}</div>
            <div class="option-row"><span>${t('format')}</span>${segment('format', ['wide', 'square'])}</div>
            <div class="option-row"><span>${t('theme')}</span>${segment('theme', ['dark', 'light'])}</div>
            <div class="option-row accent-row"><span>${t('accent')}</span><div class="accent-options" role="group" aria-label="${t('accent')}">${['lime','violet','blue'].map(value => `<button id="accent-${value}" data-group="accent" data-value="${value}" class="accent-button ${value} ${project.accent === value ? 'selected' : ''}" aria-label="${t(value)}" title="${t(value)}" aria-pressed="${project.accent === value}">${project.accent === value ? icon('check') : ''}</button>`).join('')}</div></div>
          </section>
          <div class="local-note">${icon('check')}<p><strong>${storageAvailable ? t('local') : t('localMemory')}</strong><span>${t('localSub')}</span></p></div>
          <button class="text-button fresh-button" id="start-fresh">${t('reset')}</button>
        </aside>
        <div class="preview-workspace">
          <section class="preview-panel" aria-labelledby="preview-heading"><div class="preview-heading"><div><span class="eyebrow">${t('preview')}</span><h2 id="preview-heading">${t('exportReady')}</h2></div><span class="dimension-label" id="dimensions">${project.format === 'square' ? '1200 × 1200' : '1600 × 1000'} <span>PNG</span></span></div><div class="canvas-stage"><canvas id="card-canvas" role="img" aria-label="${t('accessiblePreview')}"></canvas></div><div class="preview-footer"><span><span class="live-dot"></span>${t('rendered')}</span><button id="export-png" class="primary-button">${icon('download')}<span>${t('download')}</span></button></div><div id="warnings" class="warnings" aria-live="polite"></div></section>
          <div class="project-actions"><button class="secondary-button" id="save-project">${icon('download')}${t('save')}</button><label class="secondary-button import-label" for="import-project">${icon('upload')}${t('import')}</label><input id="import-project" class="file-input" type="file" accept=".json,application/json"/></div>
          <section class="source-panel panel"><div class="section-heading"><div><span class="eyebrow">${t('source')}</span><h2>${t('sourceTitle')}</h2></div>${icon('code')}</div><label class="diff-label" for="diff-input">${t('diffLabel')}</label><textarea id="diff-input" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" placeholder="${t('diffPlaceholder')}">${esc(project.diff)}</textarea><div id="selection">${selectionMarkup()}</div><label class="checkbox-label"><input type="checkbox" id="show-context" ${project.showContext ? 'checked' : ''}/><span>${t('showContext')}</span></label><p class="help">${t('sourceHelp')}</p></section>
          <section class="screenshots-panel panel"><div class="section-heading"><div><span class="eyebrow">${t('screenshotLabel')}</span><h2>${t('screenshotTitle')}</h2></div>${icon('image')}</div><div id="image-slots" class="image-slots">${imageSlot('before')}${imageSlot('after')}</div><p class="help">${t('imageHelp')}</p></section>
          <section class="share-panel panel"><div><span class="eyebrow">${t('share')}</span><h2>${t('shareTitle')}</h2><p class="help">${t('shareHelp')}</p></div><div class="share-actions"><button id="copy-post" class="secondary-button">${icon('copy')}${t('post')}</button><button id="copy-alt" class="secondary-button">${icon('copy')}${t('alt')}</button></div><textarea id="copy-fallback" readonly hidden aria-label="${t('post')}"></textarea></section>
        </div>
      </div>
      <footer><span>${t('footer')}</span><span>${t('footerMeta')}</span><a href="${REPO}" target="_blank" rel="noreferrer">${icon('star')} GitHub</a></footer>
    </main>`;
  bind(); repaint();
}

async function repaint() {
  const revision = ++repaintVersion;
  painting = true;
  const download = document.querySelector('#export-png');
  if (download) download.disabled = true;
  try {
    const buffer = document.createElement('canvas');
    const rendered = await renderCard(buffer, { ...project, lang }, parsed);
    if (revision !== repaintVersion) return;
    const canvas = document.querySelector('#card-canvas');
    if (!canvas) return;
    canvas.width = buffer.width; canvas.height = buffer.height;
    canvas.getContext('2d').drawImage(buffer, 0, 0);
    // This canvas is also the exact one passed to toBlob on download.
    visualWarnings = rendered.warnings || [];
    renderError = '';
    let description;
    try { description = makeAlt(project, { warnings: visualWarnings, lang }); } catch { description = [t('accessiblePreview'), project.title, project.subtitle].filter(Boolean).join('. '); }
    canvas.setAttribute('aria-label', description);
    document.querySelector('#dimensions').innerHTML = `${buffer.width} × ${buffer.height} <span>PNG</span>`;
    showWarnings();
  } catch (error) {
    if (revision !== repaintVersion) return;
    renderError = error.message || String(error); visualWarnings = [renderError]; showWarnings();
  } finally {
    if (revision === repaintVersion) { painting = false; if (download) download.disabled = false; }
  }
}
function showWarnings() {
  const items = [parseError, ...(parsed.warnings || []), ...visualWarnings].filter(Boolean).map(value => typeof value === 'string' ? value : value.message || String(value));
  if (!parsed.files.length && project.layout !== 'compare' && !parseError) items.unshift(t('noDiff'));
  const element = document.querySelector('#warnings');
  if (element) element.innerHTML = items.length ? `<div class="warning-title">${icon('warning')}<strong>${t('warnings')}</strong></div><ul>${[...new Set(items)].map(value => `<li>${esc(value)}</li>`).join('')}</ul>` : '';
}
function bindSelection() {
  document.querySelector('#file-select')?.addEventListener('change', event => { project.fileIndex = Number(event.target.value); project.hunkIndex = 0; document.querySelector('#selection').innerHTML = selectionMarkup(); bindSelection(); changed(); });
  document.querySelector('#hunk-select')?.addEventListener('change', event => { project.hunkIndex = Number(event.target.value); changed(); });
}
function bindImages() {
  for (const which of ['before','after']) {
    document.querySelector(`#${which}-input`)?.addEventListener('change', async event => {
      const file = event.target.files?.[0]; if (!file) return;
      const target = project; const request = ++imageVersions[which];
      try { const image = await readImage(file); if (project !== target || request !== imageVersions[which]) return; project[which] = image; document.querySelector('#image-slots').innerHTML = `${imageSlot('before')}${imageSlot('after')}`; bindImages(); changed(); say(t('imageAdded')); }
      catch (error) { say(t('error') + error.message); event.target.value = ''; }
    });
    document.querySelector(`#remove-${which}`)?.addEventListener('click', () => { imageVersions[which] += 1; project[which] = null; document.querySelector('#image-slots').innerHTML = `${imageSlot('before')}${imageSlot('after')}`; bindImages(); changed(); say(t('imageRemoved')); document.querySelector(`#${which}-input`)?.focus(); });
  }
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}
async function copy(value, message) {
  try { await navigator.clipboard.writeText(value); say(message); }
  catch { const fallback = document.querySelector('#copy-fallback'); fallback.hidden = false; fallback.value = value; fallback.focus(); fallback.select(); say(t('clipboardError')); }
}
function copyProjectText(helper, message) {
  try { copy(helper(project), message); } catch (error) { say(t('error') + error.message); }
}
function bind() {
  document.querySelector('#language').addEventListener('click', () => { lang = lang === 'en' ? 'zh' : 'en'; status = ''; persist(); render(); document.querySelector('#language').focus({preventScroll:true}); });
  for (const key of ['title','subtitle','repository']) document.querySelector(`#${key}`).addEventListener('input', event => { project[key] = event.target.value; const count = document.querySelector(`#${key}-count`); if (count) count.textContent = `${project[key].length}/${key === 'title' ? 100 : 220}`; changed(); });
  document.querySelectorAll('[data-group]').forEach(button => button.addEventListener('click', () => {
    const group = button.dataset.group; project[group] = button.dataset.value;
    document.querySelectorAll(`[data-group="${group}"]`).forEach(item => { const active = item.dataset.value === project[group]; item.classList.toggle('selected', active); item.setAttribute('aria-pressed', String(active)); if (group === 'accent') item.innerHTML = active ? icon('check') : ''; });
    changed();
  }));
  document.querySelector('#diff-input').addEventListener('input', event => { project.diff = event.target.value; project.fileIndex = 0; project.hunkIndex = 0; parse(); document.querySelector('#selection').innerHTML = selectionMarkup(); bindSelection(); changed(); });
  document.querySelector('#show-context').addEventListener('change', event => { project.showContext = event.target.checked; changed(); });
  bindSelection(); bindImages();
  document.querySelector('#load-demo').addEventListener('click', async () => {
    if (dirty && !confirm(t('loadDemoConfirm'))) return;
    const target = project; const version = changeVersion;
    try { const example = await loadDemo(); if (project !== target || version !== changeVersion) { say(t('loadInterrupted')); return; } project = example; dirty = false; status = t('exampleLoaded'); persist(); render(); } catch (error) { say(t('error') + error.message); }
  });
  document.querySelector('#start-fresh').addEventListener('click', () => { if (!confirm(t('resetConfirm'))) return; project = createProject(); dirty = false; status = t('resetDone'); persist(); render(); });
  document.querySelector('#save-project').addEventListener('click', () => {
    try { const content = serializeProject(project); downloadBlob(new Blob([content], {type:'application/json'}), 'patchstage-project.json'); dirty = false; say(t('projectSaved')); }
    catch (error) { say(t('error') + error.message); }
  });
  document.querySelector('#import-project').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    if (dirty && !confirm(t('importConfirm'))) { event.target.value = ''; return; }
    const target = project; const version = changeVersion;
    try { const opened = await readProject(file); if (project !== target || version !== changeVersion) { say(t('openInterrupted')); return; } project = opened; dirty = false; status = t('projectOpened'); persist(); render(); }
    catch (error) { say(t('error') + error.message); event.target.value = ''; }
  });
  document.querySelector('#export-png').addEventListener('click', async () => {
    if (painting || downloading) return;
    if (renderError) { say(t('error') + renderError); return; }
    try { validateProject(project); } catch (error) { say(t('error') + error.message); return; }
    if (project.layout !== 'code' && (!project.before || !project.after)) { say(t('imageNeeded')); document.querySelector('#image-slots').scrollIntoView({behavior:'smooth',block:'center'}); return; }
    if (project.layout !== 'compare' && !parsed.files[project.fileIndex]?.hunks?.[project.hunkIndex]) { say(t('emptySelection')); document.querySelector('#diff-input').focus(); return; }
    downloading = true; const button = document.querySelector('#export-png'); button.disabled = true; button.querySelector('span').textContent = t('downloading');
    try {
      const blob = await new Promise((resolve, reject) => document.querySelector('#card-canvas').toBlob(value => value ? resolve(value) : reject(new Error('The PNG could not be created.')), 'image/png'));
      downloadBlob(blob, `patchstage-${project.format}.png`); say(t('pngSaved'));
    } catch (error) { say(t('error') + error.message); }
    finally { downloading = false; button.disabled = false; button.querySelector('span').textContent = t('download'); }
  });
  document.querySelector('#copy-post').addEventListener('click', () => copyProjectText(makePost, t('copiedPost')));
  document.querySelector('#copy-alt').addEventListener('click', () => {
    if (painting) { say(t('rendering')); return; }
    copyProjectText(value => makeAlt(value, { warnings: visualWarnings, lang }), t('copiedAlt'));
  });
}
window.addEventListener('beforeunload', persist);
render();
if (!restored) {
  const original = project;
  const version = changeVersion;
  loadDemo().then(example => { if (!dirty && project === original && version === changeVersion) { project = example; status = t('exampleLoaded'); persist(); render(); } }).catch(error => say(t('error') + error.message));
}

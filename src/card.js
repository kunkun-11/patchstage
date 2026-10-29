const palettes = { lime: '#c8f36a', violet: '#baa1ff', blue: '#91c5ff' };
const imageCache = new Map();
const mono = '"Cascadia Code", "SFMono-Regular", Consolas, monospace';
const sans = '"Segoe UI", system-ui, sans-serif';

function roundRect(ctx, x, y, width, height, radius = 20) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
}
function text(ctx, value, x, y, font, color, align = 'left') {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillText(String(value), x, y);
}
function ellipsis(ctx, value, width) {
  const source = String(value);
  if (ctx.measureText(source).width <= width) return source;
  let result = source;
  while (result.length && ctx.measureText(result + '…').width > width) result = result.slice(0, -1);
  return result + '…';
}
function wrapped(ctx, value, x, y, width, font, color, maxLines, lineHeight) {
  ctx.font = font;
  const chars = Array.from(String(value));
  const lines = []; let current = '';
  for (const char of chars) {
    if (char === '\n') { lines.push(current.trimEnd()); current = ''; }
    else if (current && ctx.measureText(current + char).width > width) {
      const space = current.lastIndexOf(' ');
      if (space > current.length / 2) { lines.push(current.slice(0, space).trimEnd()); current = current.slice(space + 1) + char; }
      else { lines.push(current.trimEnd()); current = char; }
    }
    else current += char;
  }
  if (current || !lines.length) lines.push(current);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) visible[maxLines - 1] = ellipsis(ctx, visible[maxLines - 1] + '…', width);
  visible.forEach((line, index) => text(ctx, line, x, y + index * lineHeight, font, color));
  return { height: visible.length * lineHeight, clipped: lines.length > maxLines };
}
async function loadImage(input) {
  if (!input?.dataUrl) return null;
  if (imageCache.has(input.dataUrl)) {
    const cached = imageCache.get(input.dataUrl);
    imageCache.delete(input.dataUrl); imageCache.set(input.dataUrl, cached);
    return cached;
  }
  const pending = new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('The selected image could not be decoded.'));
    img.src = input.dataUrl;
  });
  imageCache.set(input.dataUrl, pending);
  while (imageCache.size > 4) imageCache.delete(imageCache.keys().next().value);
  try { return await pending; } catch (error) { imageCache.delete(input.dataUrl); throw error; }
}

export async function renderCard(canvas, project, parsed) {
  const beforeImage = await loadImage(project.before);
  const afterImage = await loadImage(project.after);
  const square = project.format === 'square';
  canvas.width = square ? 1200 : 1600;
  canvas.height = square ? 1200 : 1000;
  const ctx = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;
  const pad = square ? 64 : 76;
  const light = project.theme === 'light';
  const zh = project.lang === 'zh';
  const accent = palettes[project.accent] || palettes.lime;
  const c = light ? { bg: '#f7f8f4', surface: '#ffffff', code: '#f0f3ee', edge: '#dce3d7', text: '#1b2720', muted: '#6a796d', add: '#e1f0dd', remove: '#f7e5dc', addText: '#356441', removeText: '#994e39' } : { bg: '#111923', surface: '#1b2531', code: '#141e29', edge: '#304052', text: '#edf2f6', muted: '#8b9bad', add: '#243831', remove: '#3b2c30', addText: '#bfe1b8', removeText: '#edb3a3' };
  const warnings = [];
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  // A quiet grid belongs to the card itself, so the PNG matches the preview.
  ctx.strokeStyle = light ? '#dbe3d33b' : '#54637a16'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = light ? '#243d24' : accent; roundRect(ctx, pad, pad, 12, 12, 3); ctx.fill();
  text(ctx, zh ? '更新，让人看得懂' : 'A CHANGE WORTH SHOWING', pad + 26, pad - 2, `600 18px ${mono}`, c.muted);
  const title = wrapped(ctx, project.title || (zh ? '给下一次更新一个舞台。' : 'Give your next release a stage.'), pad, pad + 42, W - pad * 2, `650 ${square ? 55 : 60}px ${sans}`, c.text, 2, square ? 65 : 70);
  if (title.clipped) warnings.push(zh ? '标题过长，卡片已截断。请缩短标题。' : 'The title is clipped. Shorten it to show the complete message.');
  const subtitleY = pad + 42 + title.height + 19;
  const subtitle = wrapped(ctx, project.subtitle || (zh ? '说明这个改动让使用者获得了什么。' : 'Tell people what this change makes better.'), pad, subtitleY, W - pad * 2 - 20, `400 26px ${sans}`, c.muted, 2, 36);
  if (subtitle.clipped) warnings.push(zh ? '说明过长，卡片已截断。请精简内容。' : 'The benefit is clipped. Shorten it to show the complete message.');
  const bodyY = subtitleY + subtitle.height + 32;
  const footerY = H - pad - 31;
  const bodyH = footerY - bodyY - 28;
  const file = parsed?.files?.[project.fileIndex] || parsed?.files?.[0];
  const hunk = file?.hunks?.[project.hunkIndex] || file?.hunks?.[0];
  const lines = hunk?.lines || [];
  const path = file?.path || (zh ? '尚未选择代码变更' : 'No code change selected');

  function panel(x, y, w, h) {
    ctx.fillStyle = c.surface; roundRect(ctx, x, y, w, h, 18); ctx.fill();
    ctx.strokeStyle = c.edge; ctx.lineWidth = 1; ctx.stroke();
  }
  function screenshot(x, y, w, h, image, label, input) {
    panel(x, y, w, h);
    text(ctx, label.toUpperCase(), x + 23, y + 19, `600 17px ${mono}`, c.muted);
    const bx = x + 18; const by = y + 57; const bw = w - 36; const bh = h - 75;
    if (!image) {
      ctx.fillStyle = c.code; roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();
      text(ctx, zh ? '尚未添加截图' : 'No screenshot added', bx + bw / 2, by + bh / 2 - 15, `400 24px ${sans}`, c.muted, 'center');
      warnings.push(zh ? `${label}截图为空。添加真实截图，或选择代码版式。` : `${label} screenshot is missing. Add your real image or choose the code layout.`);
      return;
    }
    const scale = Math.min(bw / image.naturalWidth, bh / image.naturalHeight);
    const iw = image.naturalWidth * scale; const ih = image.naturalHeight * scale;
    ctx.save(); roundRect(ctx, bx, by, bw, bh, 10); ctx.clip();
    ctx.fillStyle = light ? '#e6ece0' : '#0b111a'; ctx.fillRect(bx, by, bw, bh);
    ctx.drawImage(image, bx + (bw - iw) / 2, by + (bh - ih) / 2, iw, ih); ctx.restore();
    if (input?.name) { ctx.font = `400 13px ${mono}`; text(ctx, ellipsis(ctx, input.name, Math.max(40, w - 180)), x + w - 23, y + 21, `400 13px ${mono}`, c.muted, 'right'); }
  }
  function codePair(x, y, w, h, compact = false) {
    const gap = 20; const colW = (w - gap) / 2;
    const filtered = lines.filter(line => line.type !== 'meta' && (project.showContext || line.type !== 'context'));
    const old = filtered.filter(line => line.type === 'context' || line.type === 'remove');
    const next = filtered.filter(line => line.type === 'context' || line.type === 'add');
    const rowH = 34; const lineTop = 99;
    const visible = Math.min(square ? 20 : 16, Math.max(1, Math.floor((h - lineTop - 42) / rowH)));
    let cut = 0; let long = 0;
    [[old, zh ? '修改前' : 'BEFORE', false], [next, zh ? '修改后' : 'AFTER', true]].forEach(([rows, label, added], index) => {
      const px = x + index * (colW + gap); panel(px, y, colW, h);
      const badge = added ? c.addText : c.removeText;
      ctx.fillStyle = added ? c.add : c.remove; roundRect(ctx, px + 20, y + 17, 10, 10, 3); ctx.fill();
      text(ctx, label, px + 41, y + 13, `600 17px ${mono}`, badge);
      ctx.font = `400 16px ${mono}`; text(ctx, ellipsis(ctx, path, colW - 42), px + 20, y + 51, `400 16px ${mono}`, c.muted);
      ctx.strokeStyle = c.edge; ctx.beginPath(); ctx.moveTo(px + 20, y + 81); ctx.lineTo(px + colW - 20, y + 81); ctx.stroke();
      if (!rows.length) text(ctx, zh ? '此片段没有对应行' : 'No lines on this side', px + 20, y + lineTop + 10, `400 24px ${sans}`, c.muted);
      rows.slice(0, visible).forEach((line, lineIndex) => {
        const rowY = y + lineTop + lineIndex * rowH;
        const changed = line.type === 'add' || line.type === 'remove';
        if (changed) { ctx.fillStyle = line.type === 'add' ? c.add : c.remove; ctx.fillRect(px + 9, rowY - 3, colW - 18, 32); }
        text(ctx, added ? line.newLine ?? '' : line.oldLine ?? '', px + 48, rowY + 1, `400 18px ${mono}`, c.muted, 'right');
        text(ctx, changed ? added ? '+' : '−' : ' ', px + 60, rowY - 1, `400 24px ${mono}`, changed ? added ? c.addText : c.removeText : c.muted);
        ctx.font = `400 24px ${mono}`;
        const raw = line.text.replace(/\t/g, '  ');
        const fitted = ellipsis(ctx, raw, colW - 106);
        if (raw !== fitted) long += 1;
        text(ctx, fitted, px + 84, rowY - 1, `400 24px ${mono}`, changed ? added ? c.addText : c.removeText : c.text);
      });
      const omitted = Math.max(0, rows.length - visible); cut += omitted;
      if (omitted) text(ctx, zh ? `… 另有 ${omitted} 行未显示` : `… ${omitted} more lines not shown`, px + 21, y + h - 29, `400 16px ${mono}`, c.muted);
    });
    if (cut) warnings.push(zh ? `所选片段有 ${cut} 行未显示；卡片已标注省略。` : `${cut} selected lines are not shown; omissions are labeled on the card.`);
    const excerptNotes = [];
    if (long) {
      warnings.push(zh ? `${long} 行代码超出宽度，以省略号标注。` : `${long} code lines are shortened with an ellipsis to fit the card.`);
      excerptNotes.push(zh ? '横向省略以 … 标注' : 'Long lines shortened with …');
    }
    if (!hunk) warnings.push(zh ? '没有可显示的代码片段。请粘贴包含文本变更的统一差异。' : 'No text hunk is selected. Paste a unified diff containing text changes.');
    if (!project.showContext && lines.some(line => line.type === 'context')) {
      warnings.push(zh ? '仅展示增删行，上下文已隐藏。' : 'Showing added and removed lines only; context is hidden.');
      excerptNotes.unshift(zh ? '所选片段 · 上下文已隐藏' : 'Selected excerpt · context hidden');
    }
    if (excerptNotes.length) text(ctx, excerptNotes.join(' · '), x + w, y + h + 7, `400 13px ${mono}`, c.muted, 'right');
  }

  if (project.layout === 'compare') {
    const width = (W - pad * 2 - 24) / 2;
    screenshot(pad, bodyY, width, bodyH, beforeImage, zh ? '修改前' : 'Before', project.before);
    screenshot(pad + width + 24, bodyY, width, bodyH, afterImage, zh ? '修改后' : 'After', project.after);
  } else if (project.layout === 'story') {
    const focused = lines.filter(line => line.type !== 'meta' && (project.showContext || line.type !== 'context'));
    const rowCount = Math.max(2,
      focused.filter(line => line.type === 'context' || line.type === 'remove').length,
      focused.filter(line => line.type === 'context' || line.type === 'add').length);
    const desiredCodeH = 99 + Math.min(rowCount, square ? 8 : 6) * 34 + 42;
    const imageH = Math.max(square ? 240 : 192, bodyH - 22 - Math.min(desiredCodeH, bodyH * .62));
    const width = (W - pad * 2 - 24) / 2;
    screenshot(pad, bodyY, width, imageH, beforeImage, zh ? '修改前' : 'Before', project.before);
    screenshot(pad + width + 24, bodyY, width, imageH, afterImage, zh ? '修改后' : 'After', project.after);
    codePair(pad, bodyY + imageH + 22, W - pad * 2, bodyH - imageH - 22, true);
  } else codePair(pad, bodyY, W - pad * 2, bodyH);

  ctx.strokeStyle = c.edge; ctx.beginPath(); ctx.moveTo(pad, footerY - 4); ctx.lineTo(W - pad, footerY - 4); ctx.stroke();
  ctx.font = `500 21px ${mono}`;
  let repository = project.repository || '';
  repository = repository.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const fittedRepo = ellipsis(ctx, repository, W - pad * 2 - 185);
  if (repository !== fittedRepo) warnings.push(zh ? '仓库地址较长，卡片底部已截断。' : 'The repository address is shortened in the card footer.');
  text(ctx, fittedRepo, pad, footerY + 17, `500 21px ${mono}`, c.text);
  text(ctx, 'PatchStage', W - pad, footerY + 19, `500 18px ${sans}`, c.muted, 'right');
  return { warnings };
}

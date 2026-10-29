const MAX_BYTES = 2 * 1024 * 1024;
const MAX_LINES = 30000;
const encoder = new TextEncoder();

function fail(message, line) {
  throw new Error(`${message}${line ? ` (patch line ${line}).` : '.'}`);
}

// Git quotes filenames using C escapes and UTF-8 bytes written as octal.
function quotedPath(raw, line) {
  const bytes = [];
  const controls = { a: 7, b: 8, f: 12, n: 10, r: 13, t: 9, v: 11 };
  let index = 1;
  let literal = '';
  const flush = () => { for (const byte of encoder.encode(literal)) bytes.push(byte); literal = ''; };
  while (index < raw.length) {
    const char = raw[index++];
    if (char === '"') {
      flush();
      let value;
      try { value = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes)); }
      catch { fail('A quoted filename contains invalid UTF-8 bytes; use UTF-8 filenames', line); }
      if (!value || value.includes('\0')) fail('A filename cannot be empty or contain a NUL character', line);
      return { value, end: index };
    }
    if (char !== '\\') { literal += char; continue; }
    flush();
    if (index >= raw.length) fail('A quoted filename ends with an incomplete escape', line);
    const escape = raw[index++];
    if (escape === '"' || escape === '\\') bytes.push(escape.charCodeAt(0));
    else if (Object.hasOwn(controls, escape)) bytes.push(controls[escape]);
    else if (/[0-7]/.test(escape)) {
      let octal = escape;
      while (octal.length < 3 && /[0-7]/.test(raw[index] || 'x')) octal += raw[index++];
      const byte = Number.parseInt(octal, 8);
      if (byte > 255) fail('A quoted filename has an octal escape larger than one byte', line);
      bytes.push(byte);
    } else fail(`Unsupported filename escape \\${escape}; paste Git C-quoted or UTF-8 paths`, line);
  }
  fail('A quoted filename is missing its closing quote', line);
}

function pathValue(raw, line, timestamp = false) {
  if (raw.startsWith('"')) {
    const decoded = quotedPath(raw, line);
    const tail = raw.slice(decoded.end);
    if (tail && !(timestamp && tail.startsWith('\t'))) fail('Unexpected text after a quoted filename', line);
    return decoded.value;
  }
  const value = timestamp ? raw.split('\t', 1)[0] : raw;
  if (!value || value.includes('\0')) fail('A filename cannot be empty or contain a NUL character', line);
  return value;
}

function gitPaths(raw, line) {
  if (raw.startsWith('"')) {
    const first = quotedPath(raw, line);
    const rest = raw.slice(first.end);
    if (!rest.startsWith(' ')) fail('The diff --git header must contain two filenames', line);
    return [first.value, pathValue(rest.trimStart(), line)];
  }
  const quotedSecond = raw.indexOf(' "');
  if (quotedSecond !== -1) return [pathValue(raw.slice(0, quotedSecond), line), pathValue(raw.slice(quotedSecond + 1), line)];
  // A repeated same-file pair has its separator at the midpoint, even when
  // the filename itself contains spaces or " b/". Keep this check linear.
  const middle = (raw.length - 1) / 2;
  if (Number.isInteger(middle) && raw[middle] === ' ' &&
    raw.slice(0, middle).replace(/^a\//, '') === raw.slice(middle + 1).replace(/^b\//, '')) {
    return [pathValue(raw.slice(0, middle), line), pathValue(raw.slice(middle + 1), line)];
  }
  const split = raw.indexOf(' b/');
  if (split !== -1) return [pathValue(raw.slice(0, split), line), pathValue(raw.slice(split + 1), line)];
  const plain = raw.split(' ');
  if (plain.length === 2 && plain.every(Boolean)) return plain;
  fail('Cannot separate the two filenames in diff --git; paste a standard Git diff with a/ and b/ prefixes', line);
}

function binaryPaths(raw, line) {
  if (raw.startsWith('"')) {
    const first = quotedPath(raw, line);
    if (!raw.slice(first.end).startsWith(' and ')) fail('Cannot read the two filenames in binary metadata', line);
    return [first.value, pathValue(raw.slice(first.end + 5), line)];
  }
  const quotedSecond = raw.indexOf(' and "');
  if (quotedSecond !== -1) return [pathValue(raw.slice(0, quotedSecond), line), pathValue(raw.slice(quotedSecond + 5), line)];
  const middle = (raw.length - 5) / 2;
  if (Number.isInteger(middle) && raw.slice(middle, middle + 5) === ' and ' &&
    raw.slice(0, middle).replace(/^a\//, '') === raw.slice(middle + 5).replace(/^b\//, '')) {
    return [pathValue(raw.slice(0, middle), line), pathValue(raw.slice(middle + 5), line)];
  }
  const prefixed = raw.indexOf(' and b/');
  const split = prefixed === -1 ? raw.indexOf(' and ') : prefixed;
  if (split === -1) fail('Cannot read the two filenames in binary metadata', line);
  return [pathValue(raw.slice(0, split), line), pathValue(raw.slice(split + 5), line)];
}

function normalizePair(oldPath, newPath, gitPrefixes = false) {
  const conventional = (oldPath.startsWith('a/') || oldPath === '/dev/null') &&
    (newPath.startsWith('b/') || newPath === '/dev/null');
  if (gitPrefixes || conventional) {
    oldPath = oldPath.replace(/^a\//, '');
    newPath = newPath.replace(/^b\//, '');
  }
  return [oldPath, newPath];
}

/** Parse a text diff for display. It never applies patches or executes their contents. */
export function parseDiff(input) {
  if (typeof input !== 'string') fail('The patch must be a string');
  if (encoder.encode(input).byteLength > MAX_BYTES) fail('The patch exceeds 2 MB; paste a smaller diff');
  const rows = input.replace(/\r\n/g, '\n').split('\n');
  if (rows.at(-1) === '') rows.pop();
  if (rows.length > MAX_LINES) fail('The patch exceeds 30,000 lines; paste a smaller diff');
  const files = [];
  const warnings = [];
  let current;
  let index = 0;

  const startFile = (oldPath, newPath, fromGit = false, gitPrefixes = false) => {
    [oldPath, newPath] = normalizePair(oldPath, newPath, gitPrefixes);
    current = {
      id: `file-${files.length}`, path: newPath === '/dev/null' ? oldPath : newPath,
      oldPath, newPath, status: 'modified', hunks: [],
      fromGit, gitPrefixes, hasHeaders: false, binary: false,
    };
    files.push(current);
    return current;
  };
  const setPaths = (oldPath, newPath) => {
    [oldPath, newPath] = normalizePair(oldPath, newPath, current.gitPrefixes);
    if (oldPath === '/dev/null' && newPath === '/dev/null') fail('Both sides of a file cannot be /dev/null', index + 1);
    current.oldPath = oldPath;
    current.newPath = newPath;
    current.path = newPath === '/dev/null' ? oldPath : newPath;
    if (oldPath === '/dev/null') current.status = 'added';
    else if (newPath === '/dev/null') current.status = 'deleted';
  };
  const markBinary = () => {
    if (current.hunks.length) fail('A file cannot contain both text hunks and binary metadata', index + 1);
    if (!current.binary) warnings.push(`Binary content in ${current.path} is listed but has no editable text hunks.`);
    current.binary = true;
    current.status = 'binary';
  };

  const readHunk = () => {
    const headerLine = index + 1;
    const header = rows[index];
    const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/.exec(header);
    if (!match) fail('Malformed hunk header; expected @@ -oldStart,count +newStart,count @@', headerLine);
    const [oldStart, oldCount, newStart, newCount] = [match[1], match[2] ?? '1', match[3], match[4] ?? '1'].map(Number);
    if (![oldStart, oldCount, newStart, newCount].every(Number.isSafeInteger)) fail('Hunk ranges must be safe non-negative integers', headerLine);
    if (!Number.isSafeInteger(oldStart + Math.max(oldCount - 1, 0)) || !Number.isSafeInteger(newStart + Math.max(newCount - 1, 0))) fail('A hunk line number exceeds the safe integer range', headerLine);
    if ((oldCount && oldStart < 1) || (newCount && newStart < 1)) fail('A non-empty hunk range must start at line 1 or later', headerLine);
    if (!oldCount && !newCount) fail('A hunk cannot be empty on both sides', headerLine);
    if (oldCount > MAX_LINES || newCount > MAX_LINES) fail('The hunk declares more than 30,000 lines', headerLine);
    const hunk = {
      id: `${current.id}-hunk-${current.hunks.length}`, header,
      oldStart, oldCount, newStart, newCount, section: match[5].trimStart(), lines: [],
    };
    let oldUsed = 0;
    let newUsed = 0;
    index++;
    while (oldUsed < oldCount || newUsed < newCount) {
      const row = rows[index];
      if (row === undefined || row.startsWith('@@') || row.startsWith('diff ')) {
        fail(`Hunk count mismatch: expected ${oldCount} old/${newCount} new lines, read ${oldUsed} old/${newUsed} new`, index + 1);
      }
      const prefix = row[0];
      if (prefix !== ' ' && prefix !== '+' && prefix !== '-') {
        fail('A hunk line must start with a space, +, or -; blank context lines still need a leading space', index + 1);
      }
      const consumesOld = prefix !== '+';
      const consumesNew = prefix !== '-';
      if ((consumesOld && oldUsed >= oldCount) || (consumesNew && newUsed >= newCount)) {
        fail(`Hunk count mismatch: body exceeds the declared ${oldCount} old/${newCount} new lines`, index + 1);
      }
      hunk.lines.push({
        type: prefix === ' ' ? 'context' : prefix === '+' ? 'add' : 'remove', text: row.slice(1),
        oldLine: consumesOld ? oldStart + oldUsed : null,
        newLine: consumesNew ? newStart + newUsed : null,
      });
      if (consumesOld) oldUsed++;
      if (consumesNew) newUsed++;
      index++;
      if (rows[index] === '\\ No newline at end of file') {
        hunk.lines.push({ type: 'meta', text: 'No newline at end of file', oldLine: null, newLine: null });
        index++;
      }
    }
    current.hunks.push(hunk);
  };

  while (index < rows.length) {
    const row = rows[index];
    if (/^diff --(?:cc|combined)(?: |$)/.test(row) || row.startsWith('@@@')) {
      fail('Combined merge diffs are unsupported; use git diff against one parent', index + 1);
    }
    if (row.startsWith('diff --git ')) {
      const pair = gitPaths(row.slice(11), index + 1);
      const prefixes = pair[0].startsWith('a/') && pair[1].startsWith('b/');
      startFile(...pair, true, prefixes);
      index++;
      continue;
    }
    if (current?.binary && row.startsWith('@@')) fail('A binary file cannot also contain editable text hunks', index + 1);
    if (current?.binary && !row.startsWith('--- ')) { index++; continue; }
    if (row.startsWith('--- ')) {
      const next = rows[index + 1];
      if (!next?.startsWith('+++ ')) fail('An old-file --- header must be followed immediately by a new-file +++ header', index + 1);
      const oldPath = pathValue(row.slice(4), index + 1, true);
      const newPath = pathValue(next.slice(4), index + 2, true);
      if (!current || current.hasHeaders || current.binary) startFile(oldPath, newPath);
      setPaths(oldPath, newPath);
      current.hasHeaders = true;
      index += 2;
      continue;
    }
    if (row.startsWith('+++ ')) fail('A new-file +++ header needs a preceding --- header', index + 1);
    if (row.startsWith('@@')) {
      if (!current?.hasHeaders) fail('A text hunk needs --- and +++ file headers before it', index + 1);
      readHunk();
      continue;
    }
    if (row.startsWith('Binary files ') && row.endsWith(' differ')) {
      if (!current) {
        startFile(...binaryPaths(row.slice(13, -7), index + 1));
      }
      markBinary(); index++; continue;
    }
    if (row === 'GIT binary patch') {
      if (!current) fail('GIT binary patch needs a diff --git file header', index + 1);
      markBinary(); index++; continue;
    }
    if (current?.fromGit) {
      if (row.startsWith('new file mode ')) { current.status = 'added'; current.oldPath = '/dev/null'; index++; continue; }
      if (row.startsWith('deleted file mode ')) { current.status = 'deleted'; current.newPath = '/dev/null'; current.path = current.oldPath; index++; continue; }
      if (row.startsWith('rename from ')) {
        current.oldPath = pathValue(row.slice(12), index + 1); current.status = 'renamed'; index++; continue;
      }
      if (row.startsWith('rename to ')) {
        current.newPath = pathValue(row.slice(10), index + 1); current.path = current.newPath; current.status = 'renamed'; index++; continue;
      }
      if (/^(?:index |old mode |new mode |similarity index |dissimilarity index )/.test(row)) { index++; continue; }
    }
    if (!row) { index++; continue; }
    if (current) fail('Unexpected text outside a hunk; check its declared counts and use plain git diff output', index + 1);
    // git show / diff -u may include a textual preamble before the first file.
    index++;
  }
  if (!files.length) fail('No file diff found; paste Git output or ---/+++ unified file headers');
  return {
    files: files.map(({ fromGit, gitPrefixes, hasHeaders, binary, ...file }) => file),
    warnings,
  };
}

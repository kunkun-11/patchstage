import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDiff } from '../src/diff.js';

const oneChange = '--- a/src/count.js\n+++ b/src/count.js\n@@ -3,2 +3,2 @@ increment()\n const count = 0;\n-return count;\n+return count + 1;\n';

test('parses a unified change with exact old/new line numbers and source text', () => {
  const parsed = parseDiff(oneChange);
  assert.deepEqual(parsed.warnings, []);
  assert.equal(parsed.files.length, 1);
  const file = parsed.files[0];
  assert.deepEqual({ id: file.id, path: file.path, oldPath: file.oldPath, newPath: file.newPath, status: file.status }, {
    id: 'file-0', path: 'src/count.js', oldPath: 'src/count.js', newPath: 'src/count.js', status: 'modified',
  });
  assert.deepEqual(file.hunks, [{
    id: 'file-0-hunk-0', header: '@@ -3,2 +3,2 @@ increment()', oldStart: 3, oldCount: 2, newStart: 3, newCount: 2, section: 'increment()',
    lines: [
      { type: 'context', text: 'const count = 0;', oldLine: 3, newLine: 3 },
      { type: 'remove', text: 'return count;', oldLine: 4, newLine: null },
      { type: 'add', text: 'return count + 1;', oldLine: null, newLine: 4 },
    ],
  }]);
});

test('multiple Git files and hunks keep independent ranges and stable IDs', () => {
  const input = `diff --git a/a.js b/a.js
index 123abcd..987dcba 100644
--- a/a.js
+++ b/a.js
@@ -2,2 +2,3 @@ first()
 keep
-old
+new
+extra
@@ -10 +11 @@ second()
-ten
+eleven
diff --git a/README.md b/README.md
new file mode 100644
--- /dev/null
+++ b/README.md
@@ -0,0 +1,2 @@
+title
+
`;
  const parsed = parseDiff(input);
  assert.equal(parsed.files.length, 2);
  assert.equal(parsed.files[0].hunks.length, 2);
  assert.equal(parsed.files[0].hunks[1].id, 'file-0-hunk-1');
  assert.deepEqual(parsed.files[0].hunks[1].lines.map(line => [line.oldLine, line.newLine]), [[10, null], [null, 11]]);
  assert.equal(parsed.files[1].status, 'added');
  assert.equal(parsed.files[1].oldPath, '/dev/null');
  assert.equal(parsed.files[1].path, 'README.md');
  assert.equal(parsed.files[1].hunks[0].id, 'file-1-hunk-0');
  assert.deepEqual(parsed.files[1].hunks[0].lines, [
    { type: 'add', text: 'title', oldLine: null, newLine: 1 },
    { type: 'add', text: '', oldLine: null, newLine: 2 },
  ]);
  assert.deepEqual(parseDiff(input), parsed);
});

test('zero-count deletion preserves the old filename and old line numbers', () => {
  const parsed = parseDiff('--- a/deleted.txt\n+++ /dev/null\n@@ -5,2 +4,0 @@\n-one\n-two');
  const file = parsed.files[0];
  assert.equal(file.status, 'deleted');
  assert.equal(file.path, 'deleted.txt');
  assert.equal(file.newPath, '/dev/null');
  assert.deepEqual(file.hunks[0].lines.map(line => [line.oldLine, line.newLine]), [[5, null], [6, null]]);
});

test('header-like body lines are counted as removed and added content', () => {
  const parsed = parseDiff('--- a/real.txt\n+++ b/real.txt\n@@ -1,2 +1,2 @@\n--- a/not-a-file-header\n+++ b/not-a-file-header\n unchanged\n');
  assert.equal(parsed.files.length, 1);
  assert.deepEqual(parsed.files[0].hunks[0].lines, [
    { type: 'remove', text: '-- a/not-a-file-header', oldLine: 1, newLine: null },
    { type: 'add', text: '++ b/not-a-file-header', oldLine: null, newLine: 1 },
    { type: 'context', text: 'unchanged', oldLine: 2, newLine: 2 },
  ]);
});

test('preserves empty context, tabs, and trailing whitespace', () => {
  const parsed = parseDiff('--- a/a\n+++ b/a\n@@ -1,2 +1,2 @@\n \n-\told  \n+\tnew  \n');
  assert.deepEqual(parsed.files[0].hunks[0].lines.map(line => line.text), ['', '\told  ', '\tnew  ']);
});

test('no-newline markers are metadata, not counted source lines', () => {
  const parsed = parseDiff('--- a/a\n+++ b/a\n@@ -1 +1 @@\n-old\n\\ No newline at end of file\n+new\n\\ No newline at end of file');
  assert.deepEqual(parsed.files[0].hunks[0].lines, [
    { type: 'remove', text: 'old', oldLine: 1, newLine: null },
    { type: 'meta', text: 'No newline at end of file', oldLine: null, newLine: null },
    { type: 'add', text: 'new', oldLine: null, newLine: 1 },
    { type: 'meta', text: 'No newline at end of file', oldLine: null, newLine: null },
  ]);
});

test('CRLF input and an absent final patch newline preserve the same parsed change', () => {
  assert.deepEqual(parseDiff(oneChange.replaceAll('\n', '\r\n')), parseDiff(oneChange));
  assert.deepEqual(parseDiff(oneChange.trimEnd()), parseDiff(oneChange));
});

test('unquoted filenames with spaces and timestamp-delimited unified headers', () => {
  const input = '--- old filename.txt\t2026-10-29 10:00:00 +0800\n+++ new filename.txt\t2026-10-29 11:00:00 +0800\n@@ -1 +1 @@\n-old\n+new\n';
  const file = parseDiff(input).files[0];
  assert.equal(file.oldPath, 'old filename.txt');
  assert.equal(file.newPath, 'new filename.txt');
  assert.equal(file.status, 'modified');
});

test('Git headers can have unquoted spaces, including a b/ substring in a filename', () => {
  const input = 'diff --git a/folder b/with spaces.txt b/folder b/with spaces.txt\nold mode 100644\nnew mode 100755\n';
  const file = parseDiff(input).files[0];
  assert.equal(file.oldPath, 'folder b/with spaces.txt');
  assert.equal(file.newPath, 'folder b/with spaces.txt');
  assert.deepEqual(file.hunks, []);
});

test('Git rename metadata preserves names with spaces without inventing text hunks', () => {
  const input = 'diff --git a/old name.js b/new name.js\nsimilarity index 100%\nrename from old name.js\nrename to new name.js\n';
  const file = parseDiff(input).files[0];
  assert.equal(file.status, 'renamed');
  assert.equal(file.oldPath, 'old name.js');
  assert.equal(file.newPath, 'new name.js');
  assert.equal(file.path, 'new name.js');
  assert.deepEqual(file.hunks, []);
});

test('empty added and deleted Git files use absent-side markers', () => {
  const parsed = parseDiff('diff --git a/empty.txt b/empty.txt\nnew file mode 100644\nindex 0000000..e69de29\ndiff --git a/gone.txt b/gone.txt\ndeleted file mode 100644\nindex e69de29..0000000\n');
  assert.deepEqual(parsed.files.map(file => [file.path, file.status, file.oldPath, file.newPath]), [
    ['empty.txt', 'added', '/dev/null', 'empty.txt'],
    ['gone.txt', 'deleted', 'gone.txt', '/dev/null'],
  ]);
});

test('binary metadata produces a warning and never creates editable hunks', () => {
  const parsed = parseDiff('diff --git a/image.png b/image.png\nindex aaaaaaa..bbbbbbb 100644\nBinary files a/image.png and b/image.png differ\n' + oneChange);
  assert.equal(parsed.files.length, 2);
  assert.equal(parsed.files[0].status, 'binary');
  assert.deepEqual(parsed.files[0].hunks, []);
  assert.equal(parsed.warnings.length, 1);
  assert.match(parsed.warnings[0], /image\.png.*no editable text hunks/);
  assert.equal(parsed.files[1].hunks.length, 1);
});

test('opaque Git binary payloads stop at the next Git file', () => {
  const parsed = parseDiff('diff --git a/blob.bin b/blob.bin\nGIT binary patch\nliteral 4\nLc$}NkU|;|M00aO5\n\nliteral 4\nLc$}NkU|;|M00aO5\n\ndiff --git a/src/count.js b/src/count.js\n' + oneChange);
  assert.equal(parsed.files.length, 2);
  assert.equal(parsed.files[0].status, 'binary');
  assert.equal(parsed.files[1].path, 'src/count.js');
  assert.equal(parsed.files[1].hunks.length, 1);
  assert.equal(parsed.warnings.length, 1);
});

test('standalone binary metadata correctly separates quoted filenames containing and', () => {
  const input = 'Binary files "a/中文 and old.png" and "b/中文 and new.png" differ\n' + oneChange;
  const parsed = parseDiff(input);
  assert.deepEqual([parsed.files[0].oldPath, parsed.files[0].newPath, parsed.files[0].status], ['中文 and old.png', '中文 and new.png', 'binary']);
  assert.equal(parsed.files[1].hunks.length, 1);
  const plain = parseDiff('Binary files a/image and icon.png and b/image and icon.png differ\n').files[0];
  assert.equal(plain.oldPath, 'image and icon.png');
  assert.equal(plain.newPath, 'image and icon.png');
});

test('decodes Git octal UTF-8 paths and direct quoted Unicode', () => {
  const octal = String.raw`diff --git "a/\344\270\255\346\226\207.txt" "b/\344\270\255\346\226\207.txt"
--- "a/\344\270\255\346\226\207.txt"
+++ "b/\344\270\255\346\226\207.txt"
@@ -1 +1 @@
-old
+new
`;
  assert.equal(parseDiff(octal).files[0].path, '中文.txt');
  const direct = '--- "a/中文 文件.txt"\n+++ "b/中文 文件.txt"\n@@ -1 +1 @@\n-old\n+new\n';
  assert.equal(parseDiff(direct).files[0].path, '中文 文件.txt');
});

test('decodes quoted tab, backslash and quote characters exactly', () => {
  const input = String.raw`diff --git "a/a\tb\\c\"d.txt" "b/a\tb\\c\"d.txt"
--- "a/a\tb\\c\"d.txt"
+++ "b/a\tb\\c\"d.txt"
@@ -1 +1 @@
-old
+new
`;
  assert.equal(parseDiff(input).files[0].path, 'a\tb\\c"d.txt');
});

test('supports mixed quoted/unquoted Git paths and quoted rename metadata', () => {
  const input = String.raw`diff --git a/old.txt "b/new\tname.txt"
similarity index 100%
rename from old.txt
rename to "new\tname.txt"
`;
  const file = parseDiff(input).files[0];
  assert.equal(file.oldPath, 'old.txt');
  assert.equal(file.newPath, 'new\tname.txt');
  assert.equal(file.status, 'renamed');
});

test('rejects malformed headers, invalid ranges and missing file headers', () => {
  for (const input of [
    '--- a/a\n@@ -1 +1 @@\n-old\n+new',
    '+++ b/a\n@@ -1 +1 @@\n-old\n+new',
    '@@ -1 +1 @@\n-old\n+new',
    '--- a/a\n+++ b/a\n@@ -1,nope +1 @@\n-old\n+new',
    '--- a/a\n+++ b/a\n@@ -0,1 +1 @@\n-old\n+new',
    '--- a/a\n+++ b/a\n@@ -0,0 +0,0 @@',
    '--- /dev/null\n+++ /dev/null\n',
    '--- a/a\n+++ b/a\n@@ -9007199254740991,2 +1,2 @@\n a\n b',
  ]) assert.throws(() => parseDiff(input), /header|range|empty|dev\/null|integer/i);
});

test('rejects truncated, over-counted, unprefixed and stray hunk body lines', () => {
  for (const input of [
    '--- a/a\n+++ b/a\n@@ -1,2 +1,2 @@\n same',
    '--- a/a\n+++ b/a\n@@ -1 +1,2 @@\n-old\n-too-many-old\n+new\n+extra',
    '--- a/a\n+++ b/a\n@@ -1 +1 @@\n-old\n+new\n+extra',
    '--- a/a\n+++ b/a\n@@ -1 +1 @@\n\n',
    '--- a/a\n+++ b/a\n@@ -1,2 +1,2 @@\n same\n@@ -8 +8 @@\n-old\n+new',
    '--- a/a\n+++ b/a\n@@ -1 +1 @@\n\\ No newline at end of file\n-old\n+new',
  ]) assert.throws(() => parseDiff(input), /hunk|counts|context/i);
});

test('rejects combined merge diffs with a usable alternative command', () => {
  for (const input of [
    'diff --cc file.js\n',
    'diff --combined file.js\n',
    '--- a/file.js\n+++ b/file.js\n@@@ -1,1 -1,1 +1,1 @@@\n++merged',
  ]) assert.throws(() => parseDiff(input), /Combined.*git diff against one parent/);
});

test('rejects malformed C-quoted paths instead of silently replacing bytes', () => {
  for (const path of ['"a/unterminated', String.raw`"a/\377.txt"`, String.raw`"a/\000.txt"`, String.raw`"a/\777.txt"`, String.raw`"a/\u4e2d.txt"`]) {
    assert.throws(() => parseDiff(`--- ${path}\n+++ b/file.txt\n@@ -1 +1 @@\n-old\n+new`), /filename|UTF-8|escape|quote/i);
  }
});

test('enforces both UTF-8 byte size and line limits before parsing', () => {
  assert.throws(() => parseDiff('a'.repeat(2 * 1024 * 1024 + 1)), /exceeds 2 MB/);
  assert.throws(() => parseDiff('中'.repeat(700000)), /exceeds 2 MB/);
  assert.throws(() => parseDiff('preamble\n'.repeat(30001)), /exceeds 30,000 lines/);
  assert.throws(() => parseDiff('--- a/a\n+++ b/a\n@@ -1,30001 +1 @@\n'), /declares more than 30,000/);
});

test('rejects non-string input and text that contains no file diff', () => {
  for (const input of [null, {}, 12]) assert.throws(() => parseDiff(input), /must be a string/);
  for (const input of ['', '\n\n', 'This is a release note, not a patch.']) assert.throws(() => parseDiff(input), /No file diff found/);
});

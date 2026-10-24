import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const checker = fileURLToPath(new URL('../scripts/check-agent-chatbot.mjs', import.meta.url));
const html = readFileSync(new URL('../agent/index.html', import.meta.url), 'utf8');
const embed = html.match(/<script\b[^>]*src="https:\/\/chatbot\.apocal\.jp\/margent-chat\/[^>]*><\/script>/)?.[0];
assert.ok(embed, 'The production page must include the chatbot loader.');
function check(content) {
  const directory = mkdtempSync(join(tmpdir(), 'apocal-chatbot-check-'));
  try {
    const fixture = join(directory, 'index.html');
    writeFileSync(fixture, content);
    return spawnSync(process.execPath, [checker, fixture], { encoding: 'utf8' });
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
test('accepts the committed production embed', () => assert.equal(check(html).status, 0));
test('blocks the original regression: embed removed from release', () => assert.notEqual(check(html.replace(embed, '')).status, 0));
test('blocks a commented-out embed', () => assert.notEqual(check(html.replace(embed, `<!--${embed}-->`)).status, 0));
test('blocks duplicate chatbot initialization', () => assert.notEqual(check(html.replace(embed, embed + embed)).status, 0));
test('blocks a missing or mismatched pinned config', () => assert.notEqual(check(html.replace('data-config-sha256=', 'data-missing-config-sha256=')).status, 0));

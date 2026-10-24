import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The production embed is part of the site, not an uncommitted local addition.
const source = process.argv[2] || fileURLToPath(new URL('../agent/index.html', import.meta.url));
try {
  const html = readFileSync(source, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)].map((match) =>
    Object.fromEntries([...match[1].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map((attribute) => [attribute[1], attribute[3]]))
  );
  const embeds = scripts.filter((script) => script.src?.includes('chatbot.apocal.jp/margent-chat/'));
  if (embeds.length !== 1) throw new Error('Expected exactly one production chatbot embed in /agent/.');
  const embed = embeds[0];
  if (embed.type !== 'module') throw new Error('The chatbot loader must be a module script.');
  if (!/^https:\/\/chatbot\.apocal\.jp\/margent-chat\/releases\/[a-f0-9]{64}\/loader\.js$/.test(embed.src)) throw new Error('The chatbot loader must use a pinned production release.');
  if (embed['data-customer-id'] !== 'xxxxxxx' || embed['data-project-number'] !== '182758734620') throw new Error('The chatbot customer/project configuration is missing or changed.');
  const config = /^https:\/\/margent-xxxxxxx-prod\.web\.app\/chat-config\/([a-f0-9]{64})\.json$/.exec(embed['data-config-url'] || '');
  if (!config || config[1] !== embed['data-config-sha256']) throw new Error('The pinned chatbot config URL and SHA256 must match.');
  console.log('Agent chatbot embed check passed.');
} catch (error) {
  console.error(`Deployment stopped: ${error.message}`);
  process.exitCode = 1;
}

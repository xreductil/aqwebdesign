import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(repoRoot, '.vercel-site');

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

const copy = (source, destination = source) => {
  const sourcePath = path.join(repoRoot, source);
  const destinationPath = path.join(outputRoot, destination);
  fs.cpSync(sourcePath, destinationPath, { recursive: true, force: true });
};

const copyIfExists = (source, destination = source) => {
  if (fs.existsSync(path.join(repoRoot, source))) {
    copy(source, destination);
  }
};

// Root website pages and their existing static assets.
const publicExtensions = new Set([
  '.css', '.gif', '.html', '.ico', '.jpeg', '.jpg', '.js', '.json',
  '.png', '.svg', '.txt', '.webp', '.xml'
]);

for (const entry of fs.readdirSync(repoRoot, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (publicExtensions.has(path.extname(entry.name).toLowerCase())) {
    copy(entry.name);
  }
}

copy('images');
copyIfExists('uploads');

// Public portfolio/demo paths currently linked from the website.
for (const directory of [
  'app',
  'cafe',
  'farcimensample',
  'Foodie'
]) {
  copy(directory);
}

for (const [source, destination] of [
  ['Everyfresh/dist', 'Everyfresh/dist'],
  ['Dashai/dist', 'Dashai/dist'],
  ['Patriasample/Patria/dist', 'Patriasample/Patria/dist'],
  ['Patriasample/dashboardsample/dist', 'Patriasample/dashboardsample/dist']
]) {
  copy(source, destination);
}

console.log(`Prepared Vercel output at ${path.relative(repoRoot, outputRoot)}`);

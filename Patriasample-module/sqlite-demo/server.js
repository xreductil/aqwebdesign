import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSqliteRepositories } from '../data-adapters/sqlite-repositories.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8090);
const repositories = createSqliteRepositories({
  filename: path.join(root, 'demo.sqlite'),
  schemaPath: path.resolve(root, '../data-adapters/sql-schema.sql')
});

if (!repositories.products.findById('sqlite-demo-product')) {
  repositories.products.insert({
    id: 'sqlite-demo-product', title: 'SQLite Demo Product', sku: 'SQLITE-001',
    cat: 'DEMO', priceValue: 10, img: '', desc: 'Seeded by the SQLite adapter', quantity: 20, day: '1'
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'GET' && req.url === '/health') {
    res.end(JSON.stringify({ ok: true, storage: 'sqlite' }));
    return;
  }
  if (req.method === 'GET' && req.url === '/api/products') {
    res.end(JSON.stringify({ products: repositories.products.list() }));
    return;
  }
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`SQLite demo running at http://127.0.0.1:${port}`);
});

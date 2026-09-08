# SQLite demo

Requires a Node version with `node:sqlite` (Node 22.5+; Node 25 recommended for this workspace).

```bash
npm start
curl http://127.0.0.1:8090/health
curl http://127.0.0.1:8090/api/products
```

The demo creates `demo.sqlite` locally and seeds one product through the SQLite repository adapter. It does not import the Patria application.

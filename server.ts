import { Hono } from 'hono';
import { getRequestListener, serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { validateEnv, Env } from './lib/Env.js';
import { ordersRouter } from './server/routes/orders.js';

dotenv.config();
validateEnv();

const app = new Hono();

app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.route('/api/order', ordersRouter);

async function startServer() {
  const PORT = Env.PORT;

  if (Env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // API requests → Hono, everything else → Vite dev middleware
    const honoHandler = getRequestListener(app.fetch);
    const server = createHttpServer((req, res) => {
      if (req.url?.startsWith('/api/')) {
        honoHandler(req, res);
      } else {
        vite.middlewares(req, res, () => res.end());
      }
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } else {
    app.use('*', serveStatic({ root: './dist' }));
    app.get('*', async (c) => {
      const html = await readFile(
        path.join(process.cwd(), 'dist', 'index.html'),
        'utf-8',
      );
      return c.html(html);
    });

    serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
      console.log(`Server running on http://localhost:${info.port}`);
    });
  }
}

startServer();


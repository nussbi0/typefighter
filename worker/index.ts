import { handleSubmit, handleTop, type Env } from './leaderboard';

// The Worker handles /api/* and delegates everything else to the static site.
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/api/leaderboard') {
      if (req.method === 'POST') return handleSubmit(req, env);
      if (req.method === 'GET') return handleTop(url, env);
      return new Response('Method not allowed', { status: 405 });
    }
    if (url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }
    return env.ASSETS.fetch(req);
  },
};

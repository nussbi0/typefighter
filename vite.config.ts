import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  // Proxy API calls to a locally-running `wrangler dev` (port 8787) so the
  // leaderboard works during `vite dev`. Without wrangler running it just fails
  // gracefully and the game is unaffected.
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});

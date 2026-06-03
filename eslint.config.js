import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Cloudflare Worker code runs in the Workers runtime (service-worker-like
    // globals plus Date/crypto/Response/URL).
    files: ['worker/**/*.ts'],
    languageOptions: {
      globals: { ...globals.serviceworker, ...globals.browser },
    },
  },
  prettier,
);

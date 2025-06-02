import js from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default [
  // Base configuration for all JS files
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        browser: true,
        es2021: true,
      },
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,
    },
  },
  // Global ignores
  {
    ignores: ['lib/**/*', 'bmad-agent/**/*', 'node_modules/**/*'],
  },

  // Prettier integration - must be last to override formatting rules
  eslintPluginPrettierRecommended,
]

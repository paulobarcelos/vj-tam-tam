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
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        URL: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        DataTransferItem: 'readonly',
        DataTransfer: 'readonly',
        DragEvent: 'readonly',
        FileSystemDirectoryEntry: 'readonly',
        FileSystemFileEntry: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,
    },
  },
  // Global ignores
  {
    ignores: [
      'lib/**/*',
      'bmad-agent/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      '*.log',
      '.DS_Store',
    ],
  },

  // Prettier integration - must be last to override formatting rules
  eslintPluginPrettierRecommended,
]

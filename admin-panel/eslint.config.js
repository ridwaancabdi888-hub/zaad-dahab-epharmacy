import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // This project deliberately fetches data with plain useEffect +
      // useState (no React Query/SWR) for a straightforward admin CRUD
      // tool — the classic "fetch on mount / on filter change" pattern,
      // not the state-mirroring anti-pattern this rule targets.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])

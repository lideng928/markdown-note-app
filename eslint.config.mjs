import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  { ignores: ['.next/**', 'node_modules/**', 'public/sw.js'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Caught by `npm run typecheck`; as a lint error it mostly fires on
      // deliberately-unused destructured props.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]

export default config

import { defineConfig } from 'oxfmt'

export default defineConfig({
  printWidth: 80,
  overrides: [
    {
      files: ['src/**/*.{ts,tsx,js,jsx}'],
    },
  ],
})

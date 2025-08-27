import tailwindPreset, { type Config } from '@acme/ui/tailwind.config'

export default {
  presets: [tailwindPreset],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    '../../packages/ui/src/components/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      container: {
        screens: {
          '2xl': '1680px',
        },
      },
    },
  },
} satisfies Config

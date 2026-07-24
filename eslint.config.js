import pluginVue from 'eslint-plugin-vue'
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default withVueTs(
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.history/**',
      '**/.wrangler/**',
      '**/public/*',
      '**/functions/**',
      '*.config.*',
    ],
  },
  {
    name: 'app/single-word-names',
    files: ['src/components/ui/**', 'src/components/Sidebar.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    name: 'app/typescript-rules',
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
    },
  },
  skipFormatting,
)

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Locale } from '@/i18n/locales'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const locale = ref<Locale>('zh-CN')

    function setLocale(l: Locale) {
      locale.value = l
    }

    return { locale, setLocale }
  },
  {
    persist: {
      key: 'app-locale',
      storage: localStorage,
      pick: ['locale'],
    },
  },
)

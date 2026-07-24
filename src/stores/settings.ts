import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Locale } from '@/i18n/locales'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const locale = ref<Locale>('zh-CN')
    const defaultTime = ref('today')

    function setLocale(l: Locale) {
      locale.value = l
    }

    return { locale, defaultTime, setLocale }
  },
  {
    persist: {
      key: 'app-settings',
      storage: localStorage,
      pick: ['locale', 'defaultTime'],
    },
  },
)

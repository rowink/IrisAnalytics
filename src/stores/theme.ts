import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

function applyTheme(val: boolean) {
  document.documentElement.classList.toggle('dark', val)
}

export const useThemeStore = defineStore(
  'theme',
  () => {
    const isDark = ref(false)

    watch(isDark, applyTheme, { immediate: true })

    function toggle() {
      isDark.value = !isDark.value
    }

    return { isDark, toggle }
  },
  {
    persist: {
      key: 'theme-dark',
      storage: localStorage,
      pick: ['isDark'],
    },
  },
)

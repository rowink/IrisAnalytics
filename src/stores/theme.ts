import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'theme-dark'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem(STORAGE_KEY) === 'true')

  function applyTheme(val: boolean) {
    document.documentElement.classList.toggle('dark', val)
  }
  applyTheme(isDark.value)

  watch(isDark, (val) => {
    applyTheme(val)
    localStorage.setItem(STORAGE_KEY, String(val))
  })

  function toggle() {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
})

import { defineStore } from "pinia";
import { ref } from "vue";
import type { Locale } from "@/i18n/locales";

function detectBrowserLocale(): Locale {
  const lang = navigator.language;
  if (lang.startsWith("zh")) {
    return "zh-CN";
  }
  return "en";
}

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const locale = ref<Locale>(detectBrowserLocale());
    const defaultTime = ref("today");

    function setLocale(l: Locale) {
      locale.value = l;
    }

    return { locale, defaultTime, setLocale };
  },
  {
    persist: {
      key: "app-settings",
      storage: localStorage,
      pick: ["locale", "defaultTime"]
    }
  }
);

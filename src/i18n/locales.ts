import { watch } from "vue";
import { createI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settings";
import zhCN from "./modules/zh-CN.json";
import en from "./modules/en.json";

export type Locale = "zh-CN" | "en";

export default function setupI18n() {
  const settings = useSettingsStore();

  const i18n = createI18n({
    locale: settings.locale,
    fallbackLocale: "zh-CN",
    messages: { "zh-CN": zhCN, "en": en }
  });

  watch(
    () => settings.locale,
    (locale) => {
      i18n.global.locale = locale;
    }
  );

  return i18n;
}

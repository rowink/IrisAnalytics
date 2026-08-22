<script setup lang="ts">
import { ref, computed, inject, watch } from "vue";
import type { Ref } from "vue";
import { useRouter } from "vue-router";
import { Settings, Palette, Info, Code, ChevronLeft, X, Copy, Check, ExternalLink } from "@lucide/vue";
import { useMediaQuery, useClipboard, useDebounceFn } from "@vueuse/core";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings";
import { useThemeStore } from "@/stores/theme";
import { useI18n } from "vue-i18n";
import type { Locale } from "@/i18n/locales";
import { version } from "../../package.json";

const settings = useSettingsStore();
const theme = useThemeStore();
const { t } = useI18n();
const router = useRouter();

const activeTab = ref("general");
const isMobile = useMediaQuery("(max-width: 768px)");
const mobileMenuOpen = inject<Ref<boolean>>("mobileMenuOpen")!;

const websiteId = ref("");
const scriptTag = computed(() => {
  const host = location.host;
  const id = websiteId.value.trim();
  if (!id) return null;
  return `<script defer src="https://${host}/tracker.min.js" data-website-id="${id}"><` + `/script>`;
});
const { copy, copied } = useClipboard();

// Tools: badge embed
const badgePeriod = ref("today");
const badgeLabelUv = ref("");
const badgeLabelPv = ref("");
const previewFailed = ref(false);
const { copy: copyBadge, copied: badgeCopied } = useClipboard();

const badgePeriods = [
  { label: t("time.today"), value: "today" },
  { label: t("time.yesterday"), value: "1d" },
  { label: t("time.thisWeek"), value: "week" },
  { label: t("time.thisMonth"), value: "month" },
  { label: t("time.last7days"), value: "7d" },
  { label: t("time.last30days"), value: "30d" },
  { label: t("time.last60days"), value: "60d" },
  { label: t("time.last90days"), value: "90d" }
];

const buildBadgeUrl = (style: "uv" | "pv", sign: string) => {
  const siteID = websiteId.value.trim();
  const params = new URLSearchParams({ siteID, time: badgePeriod.value, style });
  const custom = style === "uv" ? badgeLabelUv.value : badgeLabelPv.value;
  const label = custom.trim() || t(badgeLabelKeys[style][badgePeriod.value]);
  params.set("label", label);
  params.set("sign", sign);
  return `${location.origin}/badge?${params.toString()}`;
};

// 周期 → i18n 默认徽标标题（用户未自定义时使用，随周期联动，按徽标类型区分访客/浏览）
const badgeLabelKeys: Record<"uv" | "pv", Record<string, string>> = {
  uv: {
    today: "badge.labelUvToday",
    "1d": "badge.labelUvYesterday",
    week: "badge.labelUvThisWeek",
    month: "badge.labelUvThisMonth",
    "7d": "badge.labelUv7d",
    "30d": "badge.labelUv30d",
    "60d": "badge.labelUv60d",
    "90d": "badge.labelUv90d"
  },
  pv: {
    today: "badge.labelPvToday",
    "1d": "badge.labelPvYesterday",
    week: "badge.labelPvThisWeek",
    month: "badge.labelPvThisMonth",
    "7d": "badge.labelPv7d",
    "30d": "badge.labelPv30d",
    "60d": "badge.labelPv60d",
    "90d": "badge.labelPv90d"
  }
};

// 签名由服务端生成（盐仅存于服务端 env），前端不接触盐
const badgeUrls = ref<string[]>([]);
const badgeSign = ref("");
let badgeReqSeq = 0;

const loadBadgeUrls = async () => {
  const siteID = websiteId.value.trim();
  const seq = ++badgeReqSeq;
  if (!siteID) {
    badgeUrls.value = [];
    badgeSign.value = "";
    previewFailed.value = false;
    return;
  }
  try {
    const res = await fetch(`/sign?siteID=${encodeURIComponent(siteID)}`);
    const data = await res.json();
    if (seq !== badgeReqSeq) return;
    if (!res.ok || !data.success) {
      badgeUrls.value = [];
      badgeSign.value = "";
      previewFailed.value = true;
      return;
    }
    badgeUrls.value = (["pv", "uv"] as const).map((style) => buildBadgeUrl(style, data.sign));
    badgeSign.value = data.sign;
    previewFailed.value = false;
  } catch {
    if (seq !== badgeReqSeq) return;
    badgeUrls.value = [];
    badgeSign.value = "";
    previewFailed.value = true;
  }
};

const badgeEmbed = computed((): string | null => {
  const urls = badgeUrls.value;
  if (!urls.length) return null;
  return `<!-- Iris Analytics Badge -->
${urls.map((url) => `<img src="${url}" alt="Iris Analytics Badge" />`).join("\n")}`;
});

// ── Interface tab (独立的 siteID + 签名，用于 Stats API / Top Pages API) ──
const apiWebsiteId = ref("");
const apiSign = ref("");
const apiPeriod = ref("today");
const topLimit = ref("10");
let apiReqSeq = 0;

const fetchApiSign = async () => {
  const siteID = apiWebsiteId.value.trim();
  const seq = ++apiReqSeq;
  if (!siteID) {
    apiSign.value = "";
    return;
  }
  try {
    const res = await fetch(`/sign?siteID=${encodeURIComponent(siteID)}`);
    const data = await res.json();
    if (seq !== apiReqSeq) return;
    apiSign.value = res.ok && data.success ? data.sign : "";
  } catch {
    if (seq !== apiReqSeq) return;
    apiSign.value = "";
  }
};

const debouncedFetchApiSign = useDebounceFn(fetchApiSign, 500);
watch([apiWebsiteId, apiPeriod], () => debouncedFetchApiSign(), { immediate: true });

const { copy: copyApiUrl, copied: apiUrlCopied } = useClipboard();

const apiStatsUrl = computed((): string | null => {
  const siteID = apiWebsiteId.value.trim();
  if (!siteID || !apiSign.value) return null;
  const params = new URLSearchParams({ siteID, time: apiPeriod.value, sign: apiSign.value });
  return `${location.origin}/stats?${params.toString()}`;
});

const apiTopUrl = computed((): string | null => {
  const siteID = apiWebsiteId.value.trim();
  if (!siteID || !apiSign.value) return null;
  const params = new URLSearchParams({ siteID, time: apiPeriod.value, limit: topLimit.value, sign: apiSign.value });
  return `${location.origin}/top?${params.toString()}`;
});

// 输入防抖：websiteId/label 逐字符输入时避免频繁请求 /sign
const debouncedLoadBadgeUrls = useDebounceFn(loadBadgeUrls, 500);
watch(
  [websiteId, badgePeriod, badgeLabelUv, badgeLabelPv],
  () => {
    previewFailed.value = false;
    debouncedLoadBadgeUrls();
  },
  { immediate: true }
);

const selectTab = (key: string) => {
  activeTab.value = key;
  if (isMobile.value) mobileMenuOpen.value = false;
};

const goBack = () => router.back();

const tabs = computed(() => [
  { key: "general", label: t("settings.general"), icon: Settings },
  { key: "tools", label: t("settings.tools"), icon: Code },
  { key: "interface", label: t("settings.interface"), icon: Code },
  { key: "appearance", label: t("settings.theme"), icon: Palette },
  { key: "about", label: t("settings.about"), icon: Info }
]);

function switchLocale(locale: Locale) {
  settings.setLocale(locale);
}
</script>

<template>
  <div class="settings-full-page">
    <div class="settings-view">
      <!-- Left nav (desktop) -->
      <nav class="settings-nav">
        <div class="nav-header">
          <button class="back-btn" @click="goBack" :title="t('header.backToOverview')">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span>{{ t("header.settings") }}</span>
        </div>
        <button v-for="tab in tabs" :key="tab.key" class="nav-item" :class="{ active: activeTab === tab.key }" @click="selectTab(tab.key)">
          <component :is="tab.icon" class="nav-icon" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Mobile drawer -->
      <Teleport to="body">
        <Transition name="drawer">
          <div v-if="isMobile && mobileMenuOpen" class="drawer-overlay" @click.self="mobileMenuOpen = false">
            <aside class="mobile-nav">
              <div class="mobile-nav-header">
                <span>{{ t("header.settings") }}</span>
                <button class="close-btn" @click="mobileMenuOpen = false">
                  <X class="w-4 h-4" />
                </button>
              </div>
              <button v-for="tab in tabs" :key="tab.key" class="nav-item" :class="{ active: activeTab === tab.key }" @click="selectTab(tab.key)">
                <component :is="tab.icon" class="nav-icon" />
                <span>{{ tab.label }}</span>
              </button>
            </aside>
          </div>
        </Transition>
      </Teleport>

      <!-- Right content -->
      <div class="settings-content">
        <!-- General: Language -->
        <section v-if="activeTab === 'general'" class="settings-section">
          <h3 class="section-title">{{ t("settings.general") }}</h3>
          <p class="section-desc">{{ t("settings.generalDesc") }}</p>
          <div class="setting-card">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">{{ t("settings.language") }}</span>
                <span class="setting-desc">{{ t("settings.languageDesc") }}</span>
              </div>
              <div class="setting-control">
                <Select :model-value="settings.locale" @update:model-value="(v: string) => switchLocale(v as Locale)">
                  <SelectTrigger class="w-[130px] sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="zh-CN">中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <!-- General: Default time -->
        <section v-if="activeTab === 'general'" class="settings-section mt-5">
          <div class="setting-card">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">{{ t("settings.defaultTime") }}</span>
                <span class="setting-desc">{{ t("settings.defaultTimeDesc") }}</span>
              </div>
              <div class="setting-control">
                <Select :model-value="settings.defaultTime" @update:model-value="(v: string) => (settings.defaultTime = v)">
                  <SelectTrigger class="w-[130px] sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="today">{{ t("time.today") }}</SelectItem>
                      <SelectItem value="1d">{{ t("time.yesterday") }}</SelectItem>
                      <SelectItem value="week">{{ t("time.thisWeek") }}</SelectItem>
                      <SelectItem value="month">{{ t("time.thisMonth") }}</SelectItem>
                      <SelectItem value="7d">{{ t("time.last7days") }}</SelectItem>
                      <SelectItem value="30d">{{ t("time.last30days") }}</SelectItem>
                      <SelectItem value="60d">{{ t("time.last60days") }}</SelectItem>
                      <SelectItem value="90d">{{ t("time.last90days") }}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <!-- Interface: Stats & Top Pages API -->
        <section v-if="activeTab === 'interface'" class="settings-section">
          <h3 class="section-title">{{ t("settings.interface") }}</h3>
          <p class="section-desc">{{ t("settings.interfaceDesc") }}</p>
          <div class="setting-card">
            <!-- Website ID -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">{{ t("settings.websiteId") }}</span>
                <span class="setting-desc">{{ t("settings.websiteIdPlaceholder") }}</span>
              </div>
              <div class="setting-control">
                <input v-model="apiWebsiteId" type="text" :placeholder="t('settings.websiteIdPlaceholder')" class="tools-input" />
              </div>
            </div>

            <!-- Period -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="code-preview-label">{{ t("settings.badgePeriod") }}</span>
              </div>
              <div class="setting-control">
                <Select :model-value="apiPeriod" @update:model-value="apiPeriod = $event">
                  <SelectTrigger class="w-[130px] sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="p in badgePeriods" :key="p.value" :value="p.value">{{ p.label }}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- Stats API -->
            <div class="setting-row code-preview-row">
              <div class="setting-info">
                <span class="setting-label">{{ t("settings.statsTitle") }}</span>
                <span class="setting-desc">{{ t("settings.statsDesc") }}</span>
              </div>
              <button v-if="apiStatsUrl" class="copy-btn" :class="{ copied: apiUrlCopied }" @click="copyApiUrl(apiStatsUrl)" :title="apiUrlCopied ? t('settings.copied') : t('settings.statsCopyUrl')">
                <Copy v-if="!apiUrlCopied" class="w-4 h-4" />
                <Check v-else class="w-4 h-4" />
              </button>
            </div>
            <div v-if="apiStatsUrl">
              <div class="code-preview-header"></div>
              <pre class="code-block"><code>{{ apiStatsUrl }}</code></pre>
              <p class="badge-embed-hint">{{ t("settings.statsEmbedHint") }}</p>
            </div>

            <!-- Top Pages API -->
            <div class="setting-row code-preview-row">
              <div class="setting-info">
                <span class="setting-label">{{ t("settings.topTitle") }}</span>
                <span class="setting-desc">{{ t("settings.topDesc") }}</span>
              </div>
              <div class="setting-control">
                <Select :model-value="topLimit" @update:model-value="topLimit = $event">
                  <SelectTrigger class="w-[130px] sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="5">TOP 5</SelectItem>
                      <SelectItem value="10">TOP 10</SelectItem>
                      <SelectItem value="20">TOP 20</SelectItem>
                      <SelectItem value="50">TOP 50</SelectItem>
                      <SelectItem value="100">TOP 100</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div v-if="apiTopUrl">
              <div class="code-preview-header">
                <span class="code-preview-label">{{ t("settings.topUrlLabel") }}</span>
                <button class="copy-btn" :class="{ copied: apiUrlCopied }" @click="copyApiUrl(apiTopUrl)" :title="apiUrlCopied ? t('settings.copied') : t('settings.copyUrl')">
                  <Copy v-if="!apiUrlCopied" class="w-4 h-4" />
                  <Check v-else class="w-4 h-4" />
                </button>
              </div>
              <pre class="code-block"><code>{{ apiTopUrl }}</code></pre>
              <p class="badge-embed-hint">{{ t("settings.topEmbedHint") }}</p>
            </div>
          </div>
        </section>

        <!-- Appearance: Theme -->
        <section v-if="activeTab === 'appearance'" class="settings-section">
          <h3 class="section-title">{{ t("settings.theme") }}</h3>
          <p class="section-desc">{{ t("settings.themeDesc") }}</p>
          <div class="setting-card">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">{{ t("settings.theme") }}</span>
                <span class="setting-desc">{{ t("settings.themeDesc") }}</span>
              </div>
              <div class="setting-control">
                <Select :model-value="theme.isDark ? 'dark' : 'light'" @update:model-value="theme.isDark = $event === 'dark'">
                  <SelectTrigger class="w-[130px] sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="light">{{ t("settings.light") }}</SelectItem>
                      <SelectItem value="dark">{{ t("settings.dark") }}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <!-- Tools: Script Generator -->
        <section v-if="activeTab === 'tools'" class="settings-section">
          <h3 class="section-title">{{ t("settings.tools") }}</h3>
          <p class="section-desc">{{ t("settings.toolsDesc") }}</p>
          <div class="setting-card">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">{{ t("settings.websiteId") }}</span>
                <span class="setting-desc">{{ t("settings.websiteIdPlaceholder") }}</span>
              </div>
              <div class="setting-control">
                <input v-model="websiteId" type="text" :placeholder="t('settings.websiteIdPlaceholder')" class="tools-input" />
              </div>
            </div>
            <div v-if="scriptTag">
              <div class="code-preview-header">
                <span class="code-preview-label">{{ t("settings.trackingCode") }}</span>
                <button class="copy-btn" :class="{ copied }" @click="copy(scriptTag)" :title="copied ? t('settings.copied') : t('settings.copyCode')">
                  <Copy v-if="!copied" class="w-4 h-4" />
                  <Check v-else class="w-4 h-4" />
                </button>
              </div>
              <pre class="code-block"><code>{{ scriptTag }}</code></pre>
            </div>

            <!-- Badge image title & subtitle -->
            <div class="setting-row code-preview-row">
              <div class="setting-info">
                <span class="setting-label">{{ t("settings.badgeImageTitle") }}</span>
                <span class="setting-desc">{{ t("settings.badgeImageDesc") }}</span>
              </div>
            </div>

            <!-- Live preview -->
            <div v-if="badgeUrls.length">
              <div class="code-preview-header">
                <span class="code-preview-label">{{ t("settings.badgePreview") }}</span>
              </div>
              <div class="badge-preview-area">
                <template v-if="!previewFailed">
                  <img v-for="url in badgeUrls" :key="url" :src="url" alt="Iris Analytics Badge" class="badge-preview-img" @error="previewFailed = true" />
                </template>
                <span v-else class="badge-preview-error">{{ t("settings.badgePreviewError") }}</span>
              </div>
            </div>

            <!-- Period selector -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="code-preview-label">{{ t("settings.badgePeriod") }}</span>
              </div>
              <div class="setting-control">
                <Select :model-value="badgePeriod" @update:model-value="badgePeriod = $event">
                  <SelectTrigger class="w-[130px] sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem v-for="p in badgePeriods" :key="p.value" :value="p.value">{{ p.label }}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- Visitor badge label -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="code-preview-label">{{ t("settings.badgeLabelUv") }}</span>
              </div>
              <div class="setting-control">
                <input v-model="badgeLabelUv" type="text" maxlength="50" :placeholder="t(badgeLabelKeys.uv[badgePeriod])" class="tools-input" />
              </div>
            </div>

            <!-- Views badge label -->
            <div class="setting-row">
              <div class="setting-info">
                <span class="code-preview-label">{{ t("settings.badgeLabelPv") }}</span>
              </div>
              <div class="setting-control">
                <input v-model="badgeLabelPv" type="text" maxlength="50" :placeholder="t(badgeLabelKeys.pv[badgePeriod])" class="tools-input" />
              </div>
            </div>

            <!-- Embed code -->
            <div v-if="badgeEmbed">
              <div class="code-preview-header">
                <span class="code-preview-label">{{ t("settings.badgeCode") }}</span>
                <button class="copy-btn" :class="{ copied: badgeCopied }" @click="copyBadge(badgeEmbed)" :title="badgeCopied ? t('settings.copied') : t('settings.badgeCopyCode')">
                  <Copy v-if="!badgeCopied" class="w-4 h-4" />
                  <Check v-else class="w-4 h-4" />
                </button>
              </div>
              <pre class="code-block badge-code-block"><code>{{ badgeEmbed }}</code></pre>
              <p class="badge-embed-hint">{{ t("settings.badgeEmbedHint") }}</p>
            </div>
          </div>
        </section>

        <!-- About -->
        <section v-if="activeTab === 'about'" class="settings-section">
          <h3 class="section-title">{{ t("settings.about") }}</h3>
          <p class="section-desc">{{ t("settings.aboutDesc") }}</p>
          <div class="setting-card about-card">
            <div class="about-info">
              <div class="about-logo">
                <img src="/image/moe.png" alt="Iris Analytics" />
                <span>Iris Analytics</span>
              </div>
              <p class="about-version">v{{ version }}</p>
              <p class="about-desc">{{ t("settings.aboutTagline") }}</p>
              <div class="about-links">
                <a href="https://github.com/rowink/IrisAnalytics" target="_blank" rel="noopener noreferrer" class="about-link">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                  <span>{{ t("settings.github") }}</span>
                </a>
                <a href="https://github.com/rowink/IrisAnalytics/issues" target="_blank" rel="noopener noreferrer" class="about-link">
                  <ExternalLink class="w-4 h-4" />
                  <span>{{ t("settings.feedback") }}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-full-page {
  margin-left: 0 !important;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  min-height: calc(100vh - 56px);
}

.settings-view {
  display: flex;
  gap: 0;
  height: 100%;
  min-height: calc(100vh - 56px - 32px);
  background: #fff;
  border: 1px solid #e4e4e7;
  overflow: hidden;
}

:root.dark .settings-view {
  background: #09090b;
  border-color: #27272a;
}

/* ── Left nav ── */
.settings-nav {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid #e4e4e7;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

:root.dark .settings-nav {
  border-right-color: #27272a;
}

.nav-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 12px 12px 0;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #52525b;
  transition: all 0.15s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #f4f4f5;
  color: #18181b;
}

:root.dark .back-btn {
  color: #a1a1aa;
}

:root.dark .back-btn:hover {
  background: #27272a;
  color: #f4f4f5;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #52525b;
  text-align: left;
  width: 100%;
  transition: all 0.15s;
}

.nav-item:hover {
  background: #f4f4f5;
  color: #18181b;
}

.nav-item.active {
  background: #eaeffe;
  color: #4f6ef7;
  font-weight: 500;
}

:root.dark .nav-item {
  color: #a1a1aa;
}

:root.dark .nav-item:hover {
  background: #27272a;
  color: #f4f4f5;
}

:root.dark .nav-item.active {
  background: rgba(79, 110, 247, 0.15);
  color: #8b9cf7;
}

.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ── Right content ── */
.settings-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #18181b;
  margin: 0 0 4px;
}

:root.dark .section-title {
  color: #f4f4f5;
}

.section-desc {
  font-size: 13px;
  color: #a1a1aa;
  margin: 0 0 20px;
}

.setting-card {
  border: 1px solid #e4e4e7;
  overflow: hidden;
}

:root.dark .setting-card {
  border-color: #27272a;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

:root.dark .setting-row + .setting-row {
  border-top-color: #27272a;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #000000;
}

:root.dark .setting-label {
  color: #f4f4f5;
}

.setting-desc {
  font-size: 12px;
  color: #a1a1aa;
}

/* ── About ── */
.about-card {
  padding: 0;
}

.about-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
}

.about-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: #18181b;
}

:root.dark .about-logo {
  color: #f4f4f5;
}

.about-logo img {
  height: 200px;
  point-event: none;
  user-select: none;
  user-drag: none;
  -webkit-user-drag: none;
}

.about-version {
  font-size: 13px;
  color: #a1a1aa;
  margin: 0;
}

.about-desc {
  font-size: 13px;
  color: #52525b;
  margin: 0;
}

:root.dark .about-desc {
  color: #a1a1aa;
}

.about-links {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.about-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #4f6ef7;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.15s;
}

.about-link:hover {
  background: #eaeffe;
  color: #3b5bf7;
}

:root.dark .about-link {
  color: #8b9cf7;
}

:root.dark .about-link:hover {
  background: rgba(79, 110, 247, 0.15);
  color: #aebbfa;
}

/* ── Tools: Input ── */
.tools-input {
  width: 130px;
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  background: #fff;
  color: #18181b;
  outline: none;
  transition: border-color 0.15s;
}

.tools-input::placeholder {
  color: #a1a1aa;
}

.tools-input:focus {
  border-color: #e4e4e7;
}

:root.dark .tools-input {
  background: #09090b;
  border-color: #27272a;
  color: #f4f4f5;
}

:root.dark .tools-input:focus {
  border-color: #27272a;
}

@media (min-width: 640px) {
  .tools-input {
    width: 180px;
  }
}

/* ── Tools: Code preview ── */
.code-preview-row {
  border-top: 1px solid #f0f0f0;
}

:root.dark .code-preview-row {
  border-top-color: #27272a;
}

.code-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 8px;
}

.code-preview-label {
  font-size: 13px;
  font-weight: 500;
  color: #52525b;
}

:root.dark .code-preview-label {
  color: #a1a1aa;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #52525b;
  cursor: pointer;
  transition: all 0.15s;
}

.copy-btn:hover {
  background: #f4f4f5;
  color: #18181b;
}

.copy-btn.copied {
  color: #8b99f8;
}

:root.dark .copy-btn {
  background: transparent;
  color: #a1a1aa;
}

:root.dark .copy-btn:hover {
  background: #18181b;
  color: #f4f4f5;
}

:root.dark .copy-btn.copied {
  color: #8b99f8;
}

.code-block {
  margin: 0 20px 16px;
  padding: 12px 16px;
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.6;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  white-space: pre;
  tab-size: 2;
}

:root.dark .code-block {
  background: #18181b;
  border-color: #27272a;
  color: #e4e4e7;
}

.code-block code {
  word-break: keep-all;
}

.badge-section-desc {
  margin: 2px 20px 0;
  font-size: 12px;
  color: #a1a1aa;
}

.badge-preview-area {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 30px;
  min-height: 100px;
}

.badge-preview-img {
  height: 100px;
  width: auto;
  display: block;
}

.badge-preview-error {
  font-size: 13px;
  color: #a1a1aa;
}

.badge-embed-hint {
  margin: 0 20px 16px;
  font-size: 12px;
  color: #a1a1aa;
  line-height: 1.5;
}

.badge-code-block {
  max-height: 300px;
  overflow-y: auto;
}

/* ── Mobile drawer ── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
}

.mobile-nav {
  width: 260px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e4e4e7;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 2px;
}

:root.dark .mobile-nav {
  background: #09090b;
  border-right-color: #27272a;
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
}

:root.dark .mobile-nav-header {
  color: #f4f4f5;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #52525b;
  transition: background 0.15s;
}

.close-btn:hover {
  background: #f4f4f5;
}

:root.dark .close-btn {
  color: #a1a1aa;
}

:root.dark .close-btn:hover {
  background: #27272a;
}

/* ── Mobile header ── */
.mobile-settings-header {
  display: none;
}

/* ── Drawer transition ── */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-active .mobile-nav,
.drawer-leave-active .mobile-nav {
  transition: transform 0.2s ease;
}

.drawer-enter-from .mobile-nav,
.drawer-leave-to .mobile-nav {
  transform: translateX(-100%);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .settings-view {
    flex-direction: column;
    border-radius: 0;
    border: none;
    min-height: calc(100vh - 56px);
  }

  .settings-nav {
    display: none;
  }

  .settings-content {
    padding: 16px;
  }
}
</style>

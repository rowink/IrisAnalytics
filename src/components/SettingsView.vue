<template>
  <div class="settings-view">
    <!-- Left nav (GitHub style) -->
    <!-- Left nav (desktop) -->
    <nav class="settings-nav">
      <div class="nav-header">
        <button class="back-btn" @click="goBack" :title="t('header.backToOverview')">
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span>设置</span>
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
              <span>设置</span>
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
        <h3 class="section-title">{{ t("settings.language") }}</h3>
        <p class="section-desc">{{ t("settings.languageDesc") }}</p>
        <div class="setting-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">{{ t("settings.language") }}</span>
              <span class="setting-desc">{{ t("settings.languageDesc") }}</span>
            </div>
            <div class="setting-control">
              <Select :model-value="settings.locale" @update:model-value="switchLocale($event as Locale)">
                <SelectTrigger class="w-[180px]">
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
      <section v-if="activeTab === 'general'" class="settings-section">
        <h3 class="section-title">{{ t("settings.defaultTime") }}</h3>
        <p class="section-desc">{{ t("settings.defaultTimeDesc") }}</p>
        <div class="setting-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">{{ t("settings.defaultTime") }}</span>
              <span class="setting-desc">{{ t("settings.defaultTimeDesc") }}</span>
            </div>
            <div class="setting-control">
              <Select :model-value="settings.defaultTime" @update:model-value="(v: string) => settings.defaultTime = v">
                <SelectTrigger class="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="today">{{ t('time.today') }}</SelectItem>
                    <SelectItem value="1d">{{ t('time.yesterday') }}</SelectItem>
                    <SelectItem value="7d">{{ t('time.last7days') }}</SelectItem>
                    <SelectItem value="30d">{{ t('time.last30days') }}</SelectItem>
                    <SelectItem value="60d">{{ t('time.last60days') }}</SelectItem>
                    <SelectItem value="90d">{{ t('time.last90days') }}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
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
                <SelectTrigger class="w-[180px]">
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

      <!-- About -->
      <section v-if="activeTab === 'about'" class="settings-section">
        <h3 class="section-title">About</h3>
        <div class="setting-card about-card">
          <div class="about-info">
            <div class="about-logo">
              <img src="@/assets/moe.png" alt="Iris Analytics" />
              <span>Iris Analytics</span>
            </div>
            <p class="about-version">v1.0.0</p>
            <p class="about-desc">Web Analytics Dashboard</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from "vue";
import { useRouter } from "vue-router";
import { Settings, Palette, Info, ChevronLeft, X } from "lucide-vue-next";
import { useMediaQuery } from "@vueuse/core";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings";
import { useThemeStore } from "@/stores/theme";
import { useI18n } from "vue-i18n";
import type { Locale } from "@/i18n/locales";

const settings = useSettingsStore();
const theme = useThemeStore();
const { t } = useI18n();
const router = useRouter();

const activeTab = ref("general");
const isMobile = useMediaQuery("(max-width: 768px)");
const mobileMenuOpen = inject("mobileMenuOpen") as any;

const selectTab = (key: string) => {
  activeTab.value = key;
  if (isMobile.value) mobileMenuOpen.value = false;
};

const goBack = () => router.push("/");

const tabs = computed(() => [
  { key: "general", label: t("settings.language"), icon: Settings },
  { key: "appearance", label: t("settings.theme"), icon: Palette },
  { key: "about", label: "About", icon: Info }
]);

function switchLocale(locale: Locale) {
  settings.setLocale(locale);
}
</script>

<style scoped>
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
  padding: 0 12px 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
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

.setting-row + .setting-row {
  border-top: 1px solid #f0f0f0;
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
  color: #18181b;
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
  height: 120px;
  border-radius: 12px;
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

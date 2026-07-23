<template>
  <Teleport to="body">
    <Transition name="settings">
      <div v-if="open" class="settings-overlay" @click.self="$emit('close')">
        <aside class="settings-drawer" @click.stop>
          <!-- Header -->
          <div class="settings-header">
            <h3 class="settings-title">{{ t("settings.title") }}</h3>
            <button class="close-btn" @click="$emit('close')" :title="t('common.close')">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Sidebar nav + content -->
          <div class="settings-body">
            <!-- Left nav -->
            <nav class="settings-nav">
              <button v-for="tab in tabs" :key="tab.key" class="nav-item" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
                <component :is="tab.icon" class="nav-icon" />
                <span>{{ tab.label }}</span>
              </button>
            </nav>

            <!-- Right content -->
            <div class="settings-content">
              <!-- General: Language -->
              <section v-if="activeTab === 'general'" class="settings-section">
                <div class="setting-row">
                  <div class="setting-info">
                    <span class="setting-label">{{ t("settings.language") }}</span>
                    <span class="setting-desc">{{ t("settings.languageDesc") }}</span>
                  </div>
                  <div class="setting-control">
                    <select class="setting-select" :value="settings.locale" @change="switchLocale(($event.target as HTMLSelectElement).value as Locale)">
                      <option value="zh-CN">中文</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- Appearance: Theme -->
              <section v-if="activeTab === 'appearance'" class="settings-section">
                <div class="setting-row">
                  <div class="setting-info">
                    <span class="setting-label">{{ t("settings.theme") }}</span>
                    <span class="setting-desc">{{ t("settings.themeDesc") }}</span>
                  </div>
                  <div class="setting-control">
                    <select class="setting-select" :value="theme.isDark ? 'dark' : 'light'" @change="theme.isDark = ($event.target as HTMLSelectElement).value === 'dark'">
                      <option value="light">{{ t("settings.light") }}</option>
                      <option value="dark">{{ t("settings.dark") }}</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- About -->
              <section v-if="activeTab === 'about'" class="settings-section">
                <div class="about-info">
                  <div class="about-logo">
                    <img src="@/assets/moe.png" alt="Iris Analytics" />
                    <span>Iris Analytics</span>
                  </div>
                  <p class="about-version">v1.0.0</p>
                  <p class="about-desc">Web Analytics Dashboard</p>
                </div>
              </section>
            </div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { X, Settings, Palette, Info } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settings";
import { useThemeStore } from "@/stores/theme";
import { useI18n } from "vue-i18n";
import type { Locale } from "@/i18n/locales";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const settings = useSettingsStore();
const theme = useThemeStore();
const { t } = useI18n();

const activeTab = ref("general");

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
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999999;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: flex-end;
}

.settings-drawer {
  width: 600px;
  max-width: 100vw;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
}

:root.dark .settings-drawer {
  background: #09090b;
}

/* ── Header ── */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e4e7;
  flex-shrink: 0;
}

:root.dark .settings-header {
  border-bottom-color: #27272a;
}

.settings-title {
  font-size: 16px;
  font-weight: 600;
  color: #18181b;
  margin: 0;
}

:root.dark .settings-title {
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
  color: #18181b;
}

:root.dark .close-btn {
  color: #a1a1aa;
}

:root.dark .close-btn:hover {
  background: #27272a;
  color: #f4f4f5;
}

/* ── Body: sidebar + content ── */
.settings-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Left nav (GitHub style) ── */
.settings-nav {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #e4e4e7;
  padding: 12px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

:root.dark .settings-nav {
  border-right-color: #27272a;
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
  padding: 20px;
  overflow-y: auto;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

:root.dark .setting-row {
  border-bottom-color: #27272a;
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

.setting-select {
  padding: 6px 32px 6px 12px;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  background: #fff;
  color: #18181b;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  min-width: 120px;
}

:root.dark .setting-select {
  background: #09090b;
  border-color: #3f3f46;
  color: #f4f4f5;
}

/* ── About ── */
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
  width: 64px;
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

/* ── Drawer transition ── */
.settings-enter-active,
.settings-leave-active {
  transition: opacity 0.2s ease;
}

.settings-enter-from,
.settings-leave-to {
  opacity: 0;
}

.settings-enter-active .settings-drawer,
.settings-leave-active .settings-drawer {
  transition: transform 0.25s ease;
}

.settings-enter-from .settings-drawer,
.settings-leave-to .settings-drawer {
  transform: translateX(100%);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .settings-drawer {
    width: 100vw;
  }

  .settings-nav {
    width: 140px;
  }
}
</style>

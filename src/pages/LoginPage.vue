<template>
  <div class="login-page">
    <!-- Top-right actions -->
    <div class="top-actions">
      <button class="top-btn" @click="theme.toggle()" :title="theme.isDark ? t('header.toggleLight') : t('header.toggleDark')">
        <Sun v-if="!theme.isDark" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>
      <div class="lang-wrapper" ref="langRef">
        <button class="top-btn" @click="langOpen = !langOpen" :title="t('settings.language')">
          <Languages class="w-5 h-5" />
        </button>
        <Transition name="fade">
          <div v-if="langOpen" class="lang-dropdown">
            <button class="lang-option" :class="{ active: settings.locale === 'zh-CN' }" @click="switchLocale('zh-CN')">
              <span>中文</span>
              <span v-if="settings.locale === 'zh-CN'" class="lang-check">✓</span>
            </button>
            <button class="lang-option" :class="{ active: settings.locale === 'en' }" @click="switchLocale('en')">
              <span>English</span>
              <span v-if="settings.locale === 'en'" class="lang-check">✓</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <div class="login-card">
      <div class="login-header">
        <img class="login-logo" src="/image/welcome.png" alt="Iris" />
        <h1 class="login-title">Iris Analytics</h1>
        <p class="login-subtitle">{{ t("login.title") }}</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="input-wrapper">
          <input ref="passwordInput" v-model="password" type="password" :placeholder="t('login.placeholder')" class="login-input" :disabled="loading" autocomplete="current-password" />
        </div>

        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <button type="submit" class="login-button" :disabled="loading || !password">
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
          {{ t("login.button") }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Loader2, Languages, Sun, Moon } from "@lucide/vue";
import { useSettingsStore } from "@/stores/settings";
import { useThemeStore } from "@/stores/theme";
import type { Locale } from "@/i18n/locales";

const router = useRouter();
const { t } = useI18n();
const settings = useSettingsStore();
const theme = useThemeStore();

const password = ref("");
const loading = ref(false);
const errorMsg = ref("");
const passwordInput = ref<HTMLInputElement | null>(null);
const langOpen = ref(false);
const langRef = ref<HTMLElement | null>(null);

function switchLocale(locale: Locale) {
  settings.setLocale(locale);
  langOpen.value = false;
}

function onClickOutside(e: MouseEvent) {
  if (langRef.value && !langRef.value.contains(e.target as Node)) {
    langOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", onClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", onClickOutside);
});

onMounted(async () => {
  // Check if already authenticated
  try {
    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "list" })
    });
    const data = await res.json();
    if (data.success) {
      router.replace("/");
      return;
    }
  } catch {
    // Not authenticated — show login form
  }

  await nextTick();
  passwordInput.value?.focus();
});

const handleLogin = async () => {
  if (!password.value) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "Login", session: password.value })
    });

    await new Promise((resolve) => setTimeout(resolve, 666));

    const data = await res.json();
    if (!data.success) {
      errorMsg.value = data.message || t("login.enterPassword");
      return;
    }

    router.replace("/");
  } catch {
    errorMsg.value = t("login.enterPassword");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #fff;
  padding: 24px;
  box-sizing: border-box;
}

:root.dark .login-page {
  background: #09090b;
}

.login-card {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.login-logo {
  width: 350px;
  height: auto;
  border-radius: 0;
  point-event: none;
  user-select: none;
  user-drag: none;
  -webkit-user-drag: none;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #18181b;
  margin: 0;
}

:root.dark .login-title {
  color: #f4f4f5;
}

.login-subtitle {
  font-size: 14px;
  color: #a1a1aa;
  margin: 0;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrapper {
  width: 100%;
}

.login-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  font-size: 15px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  background: #fff;
  color: #18181b;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.login-input::placeholder {
  color: #a1a1aa;
}

.login-input:focus {
  outline: none;
}

.login-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:root.dark .login-input {
  background: #18181b;
  border-color: #27272a;
  color: #f4f4f5;
}

.error-text {
  font-size: 13px;
  color: #ef4444;
  margin: 0;
  text-align: center;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  border-radius: 10px;
  background: #18181b;
  color: #fafafa;
  cursor: pointer;
  transition: background 0.15s;
}

.login-button:hover:not(:disabled) {
  background: #27272a;
}

.login-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:root.dark .login-button {
  background: #f4f4f5;
  color: #18181b;
}

:root.dark .login-button:hover:not(:disabled) {
  background: #e4e4e7;
}

/* ── Top-right actions ── */
.top-actions {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 2px;
}

.top-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #52525b;
  transition: all 0.15s;
}

.top-btn:hover {
  background: #f4f4f5;
  color: #18181b;
}

:root.dark .top-btn {
  color: #a1a1aa;
}

:root.dark .top-btn:hover {
  background: #27272a;
  color: #f4f4f5;
}

.lang-wrapper {
  position: relative;
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 130px;
  background: #fff;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

:root.dark .lang-dropdown {
  background: #18181b;
  border-color: #27272a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.lang-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #52525b;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s;
}

.lang-option:hover {
  background: #f4f4f5;
  color: #18181b;
}

.lang-option.active {
  color: #18181b;
  font-weight: 500;
}

:root.dark .lang-option {
  color: #a1a1aa;
}

:root.dark .lang-option:hover {
  background: #27272a;
  color: #f4f4f5;
}

:root.dark .lang-option.active {
  color: #f4f4f5;
}

.lang-check {
  font-size: 13px;
  color: #4f6ef7;
}

/* ── Dropdown transition ── */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

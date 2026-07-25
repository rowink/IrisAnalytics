<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <img class="login-logo" src="/image/welcome.png" alt="Iris" />
        <h1 class="login-title">Iris Analytics</h1>
        <p class="login-subtitle">{{ t("login.title") }}</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="input-wrapper">
          <input
            ref="passwordInput"
            v-model="password"
            type="password"
            :placeholder="t('login.placeholder')"
            class="login-input"
            :disabled="loading"
            autocomplete="current-password"
          />
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
import { ref, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Loader2 } from "lucide-vue-next";

const router = useRouter();
const { t } = useI18n();

const password = ref("");
const loading = ref(false);
const errorMsg = ref("");
const passwordInput = ref<HTMLInputElement | null>(null);

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
</style>

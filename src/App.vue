<template>
  <section class="app">
    <!-- Fixed Header -->
    <header>
      <div class="main">
        <div class="logo" @click="switchToOverview" :title="t('header.backToOverview')">
          <img src="./assets/moe.png" />
          <p>Iris</p>
        </div>
        <div class="header-actions">
          <button class="theme-toggle" @click="theme.toggle" :title="theme.isDark ? t('header.toggleLight') : t('header.toggleDark')">
            <Sun v-if="!theme.isDark" class="w-5 h-5" />
            <Moon v-else class="w-5 h-5" />
          </button>
          <button class="icon-btn" @click="switchToSettings" :title="t('header.settings')">
            <Settings class="w-5 h-5" />
          </button>
        </div>
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <Menu class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- App Layout (Sidebar + Main) — hidden in settings -->
    <template v-if="route.name !== 'settings'">
      <Sidebar :collapsed="sidebarCollapsed" :siteList="siteList" :activeSite="activeSite" :activeView="activeView" :mobileOpen="mobileMenuOpen" @toggle-collapse="sidebarCollapsed = !sidebarCollapsed" @select-overview="switchToOverview" @select-site="switchToDetail" @close-mobile="mobileMenuOpen = false" />

      <main :class="['app-main', { 'sidebar-closed': sidebarCollapsed }]">
        <router-view />
      </main>
    </template>

    <!-- Settings — full page, no sidebar -->
    <router-view v-else />
  </section>

  <!-- Toaster -->
  <div class="z-[999999999]">
    <Toaster />
  </div>

  <!-- Login Dialog -->
  <AlertDialog :open="authStatus">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("login.title") }}</AlertDialogTitle>
        <AlertDialogDescription />
      </AlertDialogHeader>
      <Input type="text" placeholder="Password" v-model="loginPassword" />
      <AlertDialogFooter>
        <Button :disabled="loginStatus" @click="loginFn"> <Loader2 v-show="loginStatus" class="w-4 h-4 mr-2 animate-spin" />{{ t("login.button") }} </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, provide } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Loader2, Menu, Sun, Moon, Settings } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toast";
import { useToast } from "@/components/ui/toast/use-toast";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useStorage } from "@vueuse/core";
import vh from "vh-plugin";

import { useThemeStore } from "@/stores/theme";
import { useI18n } from "vue-i18n";
import Sidebar from "@/components/Sidebar.vue";

const theme = useThemeStore();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const { toast } = useToast();

// ── Auth ──
const session = useStorage("session", "");
const authStatus = ref(false);
const loginStatus = ref(false);
const loginPassword = ref("");

const loginFn = async () => {
  if (!loginPassword.value) return toast({ description: t("login.enterPassword"), variant: "destructive" });
  loginStatus.value = true;
  try {
    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "Login", session: loginPassword.value })
    });
    await new Promise((resolve) => setTimeout(resolve, 666));
    const data = await res.json();
    if (!data.success) return toast({ description: data.message, variant: "destructive" });
    session.value = loginPassword.value;
    authStatus.value = false;
    initializeApp();
  } finally {
    loginStatus.value = false;
  }
};

// ── View State (route-derived) ──
const activeView = computed(() => route.name as 'overview' | 'detail' | 'settings');
const activeSite = computed(() => (route.params.id as string) || '');
const sidebarCollapsed = ref(true);
const mobileMenuOpen = ref(false);
const timeValue = ref("today");

// ── Site List ──
interface SiteInfo {
  id: string;
  host: string;
}
const siteList = ref<SiteInfo[]>([]);

const fetchSiteList = async () => {
  try {
    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "list", session: session.value })
    });
    const data = await res.json();
    if (data.code && data.code === 401) {
      session.value = "";
      authStatus.value = true;
      return [];
    }
    if (!data.success) {
      toast({ description: data.message, variant: "destructive" });
      return [];
    }
    return data.data as SiteInfo[];
  } catch (error) {
    console.log(error);
    return [];
  }
};

// ── Overview Data ──
interface SiteVisitData {
  views?: number | string;
  visitor?: number | string;
  visit?: number | string;
}

interface SiteEchartsItem {
  name: string;
  value: number | string;
  per?: string;
}

interface SiteOverviewEntry {
  id: string;
  host: string;
  visit: SiteVisitData;
  echarts: SiteEchartsItem[];
}

const overviewData = ref<Record<string, { visit: SiteVisitData; echarts: SiteEchartsItem[] }>>({});
const overviewLoading = ref(false);

const overviewSites = computed<SiteOverviewEntry[]>(() => {
  return siteList.value.map((site) => ({
    id: site.id,
    host: site.host,
    visit: overviewData.value[site.id]?.visit || {},
    echarts: overviewData.value[site.id]?.echarts || []
  }));
});

const fetchOverviewData = async () => {
  const sites = siteList.value;
  if (!sites.length) return;

  overviewLoading.value = true;
  vh.showLoading();

  try {
    const results = await Promise.all(
      sites.map(async (site) => {
        try {
          const [visitRes, echartsRes] = await Promise.all([
            fetch("/api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "visit", siteID: site.id, time: timeValue.value, session: session.value })
            }),
            fetch("/api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "echarts", siteID: site.id, time: timeValue.value, session: session.value })
            })
          ]);

          const visitData = await visitRes.json();
          const echartsData = await echartsRes.json();

          return {
            siteId: site.id,
            visit: visitData.success ? visitData.data : {},
            echarts: echartsData.success ? echartsData.data.views : []
          };
        } catch (err) {
          console.error(`Failed to fetch data for ${site.id}:`, err);
          return { siteId: site.id, visit: {}, echarts: [] };
        }
      })
    );

    const dataMap: Record<string, { visit: SiteVisitData; echarts: SiteEchartsItem[] }> = {};
    results.forEach((r) => {
      dataMap[r.siteId] = { visit: r.visit, echarts: r.echarts };
    });
    overviewData.value = dataMap;
  } finally {
    overviewLoading.value = false;
    vh.hideLoading();
  }
};

// ── Navigation ──
const switchToOverview = () => {
  router.push('/');
};

const switchToDetail = (siteId: string) => {
  router.push(`/${siteId}`);
};

const switchToSettings = () => {
  router.push('/settings');
};

// ── Initialize (declared early for provide) ──
const initialized = ref(false);

// ── Provide shared data for route components ──
provide('timeValue', timeValue);
provide('overviewSites', overviewSites);
provide('overviewLoading', overviewLoading);
provide('initialized', initialized);

// ── Watch timeValue changes → re-fetch overview ──
watch(timeValue, () => {
  if (route.name === 'overview' && siteList.value.length > 0) {
    fetchOverviewData();
  }
});

// ── Watch route changes → re-fetch overview on navigation ──
watch(() => route.name, (name) => {
  if (name === 'overview' && siteList.value.length > 0) {
    fetchOverviewData();
  }
});

const initializeApp = async () => {
  const sites = await fetchSiteList();
  if (sites.length > 0) {
    siteList.value = sites;
    if (route.name === 'overview') {
      await fetchOverviewData();
    }
  }
  initialized.value = true;
};

onMounted(async () => {
  // Try loading data first — API returns 401 if password is required
  await initializeApp();
});
</script>

<style scoped>
@import "@/assets/index.less";

/* ── Layout overrides for sidebar ── */
.app-main {
  margin-left: 220px;
  padding: 16.66px 32px;
  transition: margin-left 0.2s ease;
  box-sizing: border-box;
  width: auto;
  max-width: none;
  height: auto;
  overflow-x: hidden;
  overflow-y: visible;
}

.app-main.sidebar-closed {
  margin-left: 52px;
}

.content-section {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* ── Settings full page override ── */
.settings-full-page {
  margin-left: 0 !important;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  min-height: calc(100vh - 56px);
}

/* ── Header action buttons (theme toggle + settings) ── */
.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.theme-toggle,
.icon-btn {
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
  transition:
    background 0.15s,
    color 0.15s;
}

.theme-toggle:hover,
.icon-btn:hover {
  background: #f4f4f5;
  color: #18181b;
}

:root.dark .theme-toggle,
:root.dark .icon-btn {
  color: #a1a1aa;
}

:root.dark .theme-toggle:hover,
:root.dark .icon-btn:hover {
  background: #27272a;
  color: #f4f4f5;
}

/* ── Mobile menu button (hidden on desktop) ── */
.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #52525b;
  transition:
    background 0.15s,
    color 0.15s;
}

.mobile-menu-btn:hover {
  background: #f4f4f5;
  color: #18181b;
}

:root.dark .mobile-menu-btn {
  color: #a1a1aa;
}

:root.dark .mobile-menu-btn:hover {
  background: #27272a;
  color: #f4f4f5;
}

/* ── Responsive: mobile ≤ 768px ── */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .app-main {
    margin-left: 0 !important;
    padding: 12px 16px;
  }

  .app-main.sidebar-closed {
    margin-left: 0 !important;
  }
}
</style>

<style>
/* Global z-index fixes */
.fixed.inset-0.z-50,
.fixed.grid.w-full.max-w-lg.shadow-lg.duration-200 {
  z-index: 99999999;
}
</style>

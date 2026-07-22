<template>
  <section class="app">
    <!-- Fixed Header -->
    <header>
      <div class="main">
        <div class="logo">
          <img src="./assets/favicon.ico" />
        </div>
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <Menu class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Sidebar -->
    <Sidebar
      :collapsed="sidebarCollapsed"
      :siteList="siteList"
      :activeSite="selectedSite"
      :activeView="viewMode"
      :mobileOpen="mobileMenuOpen"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      @select-overview="switchToOverview"
      @select-site="switchToDetail"
      @close-mobile="mobileMenuOpen = false"
    />

    <!-- Main Content -->
    <main :class="['app-main', { 'sidebar-closed': sidebarCollapsed }]">
      <!-- Overview Grid -->
      <section v-if="viewMode === 'overview'" class="content-section">
        <OverviewGrid
          :sites="overviewSites"
          :loading="overviewLoading"
          :initialized="initialized"
          @select-site="switchToDetail"
        />
      </section>

      <!-- Site Detail -->
      <section v-else class="content-section">
        <SiteDetail
          v-if="selectedSite"
          :key="selectedSite + timeValue"
          :siteId="selectedSite"
          :timeValue="timeValue"
          @update:timeValue="timeValue = $event"
        />
      </section>

    </main>
  </section>

  <!-- Toaster -->
  <div class="z-[999999999]">
    <Toaster />
  </div>

  <!-- Login Dialog -->
  <AlertDialog :open="authStatus">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>请输入登录密码</AlertDialogTitle>
        <AlertDialogDescription />
      </AlertDialogHeader>
      <Input type="text" placeholder="Password" v-model="loginPassword" />
      <AlertDialogFooter>
        <Button :disabled="loginStatus" @click="loginFn">
          <Loader2 v-show="loginStatus" class="w-4 h-4 mr-2 animate-spin" />登录
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Loader2, Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/toast'
import { useToast } from '@/components/ui/toast/use-toast'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useStorage } from '@vueuse/core'
import vh from 'vh-plugin'

import Sidebar from '@/components/Sidebar.vue'
import OverviewGrid from '@/components/OverviewGrid.vue'
import SiteDetail from '@/components/SiteDetail.vue'

const { toast } = useToast()

// ── Auth ──
const session = useStorage('session', '')
const authStatus = ref(false)
const loginStatus = ref(false)
const loginPassword = ref('')

const loginFn = async () => {
  if (!loginPassword.value) return toast({ description: '请输入密码', variant: 'destructive' })
  loginStatus.value = true
  try {
    const res = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'Login', session: loginPassword.value })
    })
    await new Promise(resolve => setTimeout(resolve, 666))
    const data = await res.json()
    if (!data.success) return toast({ description: data.message, variant: 'destructive' })
    session.value = loginPassword.value
    authStatus.value = false
    initializeApp()
  } finally {
    loginStatus.value = false
  }
}

// ── View State ──
const viewMode = ref<'overview' | 'detail'>('overview')
const selectedSite = ref('')
const sidebarCollapsed = ref(true)
const mobileMenuOpen = ref(false)
const timeValue = ref('today')

// ── Site List ──
interface SiteInfo {
  id: string
  host: string
}
const siteList = ref<SiteInfo[]>([])

const fetchSiteList = async () => {
  try {
    const res = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'list', session: session.value })
    })
    const data = await res.json()
    if (data.code && data.code === 401) {
      session.value = ''
      authStatus.value = true
      return []
    }
    if (!data.success) {
      toast({ description: data.message, variant: 'destructive' })
      return []
    }
    return data.data as SiteInfo[]
  } catch (error) {
    console.log(error)
    return []
  }
}

// ── Overview Data ──
interface SiteVisitData {
  views?: number | string
  visitor?: number | string
  visit?: number | string
}

interface SiteEchartsItem {
  name: string
  value: number | string
  per?: string
}

interface SiteOverviewEntry {
  id: string
  host: string
  visit: SiteVisitData
  echarts: SiteEchartsItem[]
}

const overviewData = ref<Record<string, { visit: SiteVisitData; echarts: SiteEchartsItem[] }>>({})
const overviewLoading = ref(false)

const overviewSites = computed<SiteOverviewEntry[]>(() => {
  return siteList.value.map(site => ({
    id: site.id,
    host: site.host,
    visit: overviewData.value[site.id]?.visit || {},
    echarts: overviewData.value[site.id]?.echarts || []
  }))
})

const fetchOverviewData = async () => {
  const sites = siteList.value
  if (!sites.length) return

  overviewLoading.value = true
  vh.showLoading()

  try {
    const results = await Promise.all(
      sites.map(async (site) => {
        try {
          const [visitRes, echartsRes] = await Promise.all([
            fetch('/api', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'visit', siteID: site.id, time: timeValue.value, session: session.value })
            }),
            fetch('/api', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'echarts', siteID: site.id, time: timeValue.value, session: session.value })
            })
          ])

          const visitData = await visitRes.json()
          const echartsData = await echartsRes.json()

          return {
            siteId: site.id,
            visit: visitData.success ? visitData.data : {},
            echarts: echartsData.success ? echartsData.data : []
          }
        } catch (err) {
          console.error(`Failed to fetch data for ${site.id}:`, err)
          return { siteId: site.id, visit: {}, echarts: [] }
        }
      })
    )

    const dataMap: Record<string, { visit: SiteVisitData; echarts: SiteEchartsItem[] }> = {}
    results.forEach(r => {
      dataMap[r.siteId] = { visit: r.visit, echarts: r.echarts }
    })
    overviewData.value = dataMap
  } finally {
    overviewLoading.value = false
    vh.hideLoading()
  }
}

// ── Navigation ──
const switchToOverview = () => {
  viewMode.value = 'overview'
  selectedSite.value = ''
  fetchOverviewData()
}

const switchToDetail = (siteId: string) => {
  selectedSite.value = siteId
  viewMode.value = 'detail'
}

// ── Watch timeValue changes → re-fetch overview ──
watch(timeValue, () => {
  if (viewMode.value === 'overview' && siteList.value.length > 0) {
    fetchOverviewData()
  }
})

// ── Initialize ──
const initialized = ref(false)

const initializeApp = async () => {
  const sites = await fetchSiteList()
  if (sites.length > 0) {
    siteList.value = sites
    viewMode.value = 'overview'
    await fetchOverviewData()
  }
  initialized.value = true
}

onMounted(async () => {
  // Try loading data first — API returns 401 if password is required
  await initializeApp()
})
</script>

<style scoped>
@import '@/assets/index.less';

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

/* ── Mobile menu button (hidden on desktop) ── */
.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-left: auto;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #52525b;
  transition: background 0.15s;
}

.mobile-menu-btn:hover {
  background: #f4f4f5;
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

<template>
  <!-- ── Desktop sidebar (hidden on mobile via CSS) ── -->
  <aside
    v-show="!isMobile"
    class="sidebar"
    :class="{ collapsed }"
  >
    <div class="sidebar-inner">
      <div class="sidebar-header">
        <button
          class="toggle-btn"
          @click="$emit('toggle-collapse')"
          :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <PanelLeftClose v-if="!collapsed" />
          <PanelLeftOpen v-else />
        </button>
        <span v-if="!collapsed" class="sidebar-title">导航</span>
      </div>

      <SidebarNav
        :collapsed="collapsed"
        :site-list="siteList"
        :active-site="activeSite"
        :active-view="activeView"
        :favicon-failed="faviconFailed"
        @select-overview="onSelectOverview"
        @select-site="onSelectSite"
        @favicon-error="onFaviconError"
      />
    </div>
  </aside>

  <!-- ── Mobile drawer ── -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isMobile && mobileOpen" class="drawer-overlay" @click.self="$emit('close-mobile')">
        <aside class="mobile-sidebar">
          <div class="sidebar-inner">
            <div class="sidebar-header">
              <span class="sidebar-title">导航</span>
              <button class="close-btn" @click="$emit('close-mobile')">
                <X />
              </button>
            </div>

            <SidebarNav
              :collapsed="false"
              :site-list="siteList"
              :active-site="activeSite"
              :active-view="activeView"
              :favicon-failed="faviconFailed"
              @select-overview="onSelectOverview"
              @select-site="onSelectSite"
              @favicon-error="onFaviconError"
            />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { PanelLeftClose, PanelLeftOpen, LayoutDashboard, Globe, X } from 'lucide-vue-next'
import SidebarNav from './SidebarNav.vue'

const isMobile = useMediaQuery('(max-width: 768px)')

const faviconFailed = reactive<Record<string, boolean>>({})
const onFaviconError = (site: string) => {
  faviconFailed[site] = true
}

const props = defineProps<{
  collapsed: boolean
  siteList: { id: string; host: string }[]
  activeSite: string
  activeView: 'overview' | 'detail'
  mobileOpen?: boolean
}>()

const emit = defineEmits<{
  'toggle-collapse': []
  'select-overview': []
  'select-site': [siteId: string]
  'close-mobile': []
}>()

const onSelectOverview = () => emit('select-overview')
const onSelectSite = (siteId: string) => {
  emit('select-site', siteId)
  emit('close-mobile')
}
</script>

<style scoped>
/* ── Desktop sidebar ── */
.sidebar {
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  width: 220px;
  background: #fff;
  border-right: 1px solid #e4e4e7;
  transition: width 0.2s ease;
  z-index: 9999999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 52px;
}

/* ── Mobile drawer overlay ── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
}

.mobile-sidebar {
  width: 260px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e4e4e7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Shared inner content ── */
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 10px;
  border-bottom: 1px solid #f0f0f0;
  min-height: 48px;
}

.toggle-btn,
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
  flex-shrink: 0;
  transition: background 0.15s;
}

.toggle-btn:hover,
.close-btn:hover {
  background: #f4f4f5;
}

.toggle-btn :deep(svg),
.close-btn :deep(svg) {
  width: 18px;
  height: 18px;
}

.close-btn {
  margin-left: auto;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
  white-space: nowrap;
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

.drawer-enter-active .mobile-sidebar,
.drawer-leave-active .mobile-sidebar {
  transition: transform 0.2s ease;
}

.drawer-enter-from .mobile-sidebar,
.drawer-leave-to .mobile-sidebar {
  transform: translateX(-100%);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .sidebar {
    display: none !important;
  }
}
</style>

<template>
  <aside
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

      <nav class="sidebar-nav">
        <button
          class="nav-item"
          :class="{ active: activeView === 'overview' }"
          @click="$emit('select-overview')"
        >
          <LayoutDashboard class="nav-icon" />
          <span v-if="!collapsed" class="nav-label">总览</span>
        </button>

        <div v-if="!collapsed" class="nav-divider">
          <span>站点列表</span>
        </div>

        <button
          v-for="site in siteList"
          :key="site.id"
          class="nav-item site-item"
          :class="{ active: activeView === 'detail' && activeSite === site.id }"
          @click="$emit('select-site', site.id)"
        >
          <img
            v-if="!faviconFailed[site.id]"
            class="nav-icon"
            :src="`https://icons.duckduckgo.com/ip3/${site.host}.ico`"
            referrerpolicy="no-referrer"
            @error="onFaviconError(site.id)"
          />
          <Globe v-else class="nav-icon" />
          <span v-if="!collapsed" class="nav-label line-clamp-1">{{ site.id }}</span>
        </button>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { PanelLeftClose, PanelLeftOpen, LayoutDashboard, Globe } from 'lucide-vue-next'

const faviconFailed = reactive<Record<string, boolean>>({})
const onFaviconError = (site: string) => {
  faviconFailed[site] = true
}

defineProps<{
  collapsed: boolean
  siteList: { id: string; host: string }[]
  activeSite: string
  activeView: 'overview' | 'detail'
}>()

defineEmits<{
  'toggle-collapse': []
  'select-overview': []
  'select-site': [siteId: string]
}>()


</script>

<style scoped>
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

.toggle-btn {
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

.toggle-btn:hover {
  background: #f4f4f5;
}

.toggle-btn :deep(svg) {
  width: 18px;
  height: 18px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #52525b;
  text-align: left;
  width: 100%;
  transition: all 0.15s;
  white-space: nowrap;
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

.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-divider {
  display: flex;
  align-items: center;
  padding: 12px 10px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #f0f0f0;
  margin-left: 8px;
}

.site-item {
  padding-left: 10px;
}

/* Scrollbar styling */
.sidebar-nav::-webkit-scrollbar {
  width: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
}

.sidebar-nav:hover::-webkit-scrollbar-thumb {
  background: #d4d4d8;
}
</style>

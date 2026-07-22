<template>
  <nav class="sidebar-nav">
    <div class="nav-fixed">
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
    </div>

    <div class="nav-scroll">
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
    </div>
  </nav>
</template>

<script setup lang="ts">
import { LayoutDashboard, Globe } from 'lucide-vue-next'

defineProps<{
  collapsed: boolean
  siteList: { id: string; host: string }[]
  activeSite: string
  activeView: 'overview' | 'detail'
  faviconFailed: Record<string, boolean>
}>()

const emit = defineEmits<{
  'select-overview': []
  'select-site': [siteId: string]
  'favicon-error': [siteId: string]
}>()

const onFaviconError = (siteId: string) => {
  emit('favicon-error', siteId)
}
</script>

<style scoped>
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px 6px;
}

.nav-fixed {
  flex-shrink: 0;
}

.nav-scroll {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  margin: 0 -6px;
  padding: 0 6px;
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

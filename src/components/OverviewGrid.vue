<template>
  <div class="overview-container">
    <div class="overview-header">
      <h2 class="overview-title">站点总览</h2>
      <p class="overview-subtitle">共 {{ sites.length }} 个站点</p>
    </div>

    <div v-if="loading" class="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
      <div v-for="i in 6" :key="i">
        <SiteCard :siteId="''" :loading="true" @select="() => {}" />
      </div>
    </div>

    <div v-else-if="sites.length === 0" class="empty-state">
      <Alert variant="default" class="max-w-md mx-auto">
        <AlertDescription>
          <p>暂无站点数据。请确保已正确集成追踪代码并已有有效访问。</p>
        </AlertDescription>
      </Alert>
    </div>

    <div v-else class="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
      <SiteCard
        v-for="site in sites"
        :key="site.id"
        :siteId="site.id"
        :visitData="site.visit"
        :echartsData="site.echarts"
        :loading="false"
        @select="(id: string) => $emit('select-site', id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SiteCard from './SiteCard.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SiteOverview {
  id: string
  visit: {
    views?: number | string
    visitor?: number | string
    visit?: number | string
  }
  echarts?: Array<{ name: string; value: number | string; per?: string }>
}

defineProps<{
  sites: SiteOverview[]
  loading: boolean
}>()

defineEmits<{
  'select-site': [siteId: string]
}>()
</script>

<style scoped>
.overview-container {
  padding: 24px 0;
}

.overview-header {
  margin-bottom: 24px;
}

.overview-title {
  font-size: 20px;
  font-weight: 700;
  color: #18181b;
  margin: 0;
}

.overview-subtitle {
  font-size: 13px;
  color: #a1a1aa;
  margin-top: 4px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>

<template>
  <Card
    class="site-card cursor-pointer transition-all duration-150 hover:shadow-md hover:border-[#4f6ef7]/30"
    @click="$emit('select', siteId)"
  >
    <CardHeader class="pb-3">
      <div class="flex items-center gap-2">
        <Globe class="w-4 h-4 text-[#4f6ef7]" />
        <CardTitle class="text-sm font-medium line-clamp-1">{{ siteId }}</CardTitle>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div v-if="loading" class="space-y-3">
        <div class="flex gap-4">
          <div class="flex-1 space-y-1">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-6 w-16" />
          </div>
          <div class="flex-1 space-y-1">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-6 w-16" />
          </div>
          <div class="flex-1 space-y-1">
            <Skeleton class="h-3 w-12" />
            <Skeleton class="h-6 w-16" />
          </div>
        </div>
        <Skeleton class="h-[60px] w-full" />
      </div>
      <template v-else>
        <div class="flex gap-4 mb-3">
          <div class="stat-item">
            <span class="stat-label">Views</span>
            <p class="stat-value">{{ displayVisit.views }}</p>
          </div>
          <div class="stat-item">
            <span class="stat-label">Visitors</span>
            <p class="stat-value">{{ displayVisit.visitor }}</p>
          </div>
          <div class="stat-item">
            <span class="stat-label">Visits</span>
            <p class="stat-value">{{ displayVisit.visit }}</p>
          </div>
        </div>
        <div ref="sparklineRef" class="sparkline-container"></div>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, markRaw, computed } from 'vue'
import * as echarts from 'echarts'
import { Globe } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps<{
  siteId: string
  visitData?: {
    views?: number | string
    visitor?: number | string
    visit?: number | string
  }
  echartsData?: Array<{ name: string; value: number | string; per?: string }>
  loading?: boolean
}>()

defineEmits<{
  select: [siteId: string]
}>()

const displayVisit = computed(() => ({
  views: props.visitData?.views ?? '-',
  visitor: props.visitData?.visitor ?? '-',
  visit: props.visitData?.visit ?? '-'
}))

const sparklineRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

const renderSparkline = () => {
  if (!sparklineRef.value || !props.echartsData?.length) return

  const values = props.echartsData.map(i => Number(i.value))
  const isEmpty = values.every(v => v === 0)

  if (isEmpty) {
    if (chart) chart.dispose()
    chart = null
    sparklineRef.value.innerHTML = '<div class="empty-chart">暂无数据</div>'
    return
  }

  if (!chart) {
    chart = markRaw(echarts.init(sparklineRef.value, null, { renderer: 'svg', useDirtyRect: true }))
  }

  chart.setOption({
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: { show: false, type: 'category', data: props.echartsData.map(i => i.name) },
    yAxis: { show: false, type: 'value' },
    tooltip: { show: false },
    series: [{
      data: values,
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 1.5, color: '#4f6ef7' },
      areaStyle: {
        opacity: 0.3,
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#4f6ef7' },
            { offset: 1, color: '#ffffff' }
          ]
        }
      }
    }]
  })
}

const handleResize = () => chart?.resize()

watch(() => props.echartsData, () => {
  if (props.echartsData) renderSparkline()
}, { deep: true })

onMounted(() => {
  if (props.echartsData) renderSparkline()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.site-card {
  width: 100%;
  border: 1px solid #e4e4e7;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 11px;
  color: #a1a1aa;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #18181b;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sparkline-container {
  width: 100%;
  height: 60px;
}

.empty-chart {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #a1a1aa;
}
</style>

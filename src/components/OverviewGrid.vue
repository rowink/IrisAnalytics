<template>
  <div class="overview-container">
    <div class="overview-header">
      <div class="overview-header-left">
        <h2 class="overview-title">站点总览</h2>
        <p class="overview-subtitle">共 {{ sites.length }} 个站点</p>
      </div>
      <div class="overview-header-right">
        <div class="flex items-center gap-2 text-sm text-[#52525b]">
          <Clock class="w-4 h-4" />
        </div>
        <Select :disabled="loading" :model-value="timeValue" @update:model-value="$emit('update:timeValue', $event)">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="选择周期" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Cycle Time</SelectLabel>
              <SelectItem :value="i.value" v-for="i in timeList" :key="i.name">{{ i.name }}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div v-if="loading" class="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
      <div v-for="i in 6" :key="i">
        <SiteCard :siteId="''" :loading="true" @select="() => {}" />
      </div>
    </div>

    <div v-else-if="initialized && sites.length === 0" class="empty-state">
      <Alert variant="default" class="max-w-md mx-auto">
        <AlertDescription>
          <p>暂无站点数据。请确保已正确集成追踪代码并已有有效访问。</p>
        </AlertDescription>
      </Alert>
    </div>

    <div v-else class="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
      <SiteCard v-for="site in sites" :key="site.id" :siteId="site.id" :host="site.host" :visitData="site.visit" :echartsData="site.echarts" :loading="false" @select="(id: string) => $emit('select-site', id)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SiteCard from "./SiteCard.vue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-vue-next";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SiteOverview {
  id: string;
  host: string;
  visit: {
    views?: number | string;
    visitor?: number | string;
    visit?: number | string;
  };
  echarts?: Array<{ name: string; value: number | string; per?: string }>;
}

const props = defineProps<{
  sites: SiteOverview[];
  loading: boolean;
  initialized: boolean;
  timeValue: string;
}>();

const emit = defineEmits<{
  "select-site": [siteId: string];
  "update:timeValue": [value: string];
}>();

const timeList = [
  { name: "Today", value: "today" },
  { name: "Yesterday", value: "1d" },
  { name: "Last 7 days", value: "7d" },
  { name: "Last 30 days", value: "30d" },
  { name: "Last 60 days", value: "60d" },
  { name: "Last 90 days", value: "90d" }
];
</script>

<style scoped>
.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.overview-header-left {
  flex: 1;
}

.overview-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.overview-title {
  font-size: 22px;
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

:root.dark .overview-title {
  color: #f4f4f5;
}

:root.dark .overview-subtitle {
  color: #6b7280;
}
</style>

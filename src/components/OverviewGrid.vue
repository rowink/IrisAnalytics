<template>
  <div class="overview-container">
    <div class="overview-header">
      <div class="overview-header-left">
        <h2 class="overview-title">{{ t('overview.title') }}</h2>
        <p class="overview-subtitle">{{ t('overview.subtitle', { count: sites.length }) }}</p>
      </div>
      <div class="overview-header-right">
        <div class="relative w-full sm:w-auto">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
          <Input
            v-model="searchQuery"
            :placeholder="t('overview.searchPlaceholder')"
            class="pl-8 h-9 w-full sm:w-[200px] text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          />
        </div>
        <div class="flex items-center gap-2 text-sm text-[#52525b] shrink-0">
          <Clock class="w-4 h-4" />
        </div>
        <Select :disabled="loading" :model-value="timeValue" @update:model-value="$emit('update:timeValue', $event)">
          <SelectTrigger class="w-full sm:w-[180px]">
            <SelectValue :placeholder="t('overview.selectPeriod')" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{{ t('cycle.time') }}</SelectLabel>
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
          <p>{{ t('overview.emptyTitle') }} {{ t('overview.emptyDesc') }}</p>
        </AlertDescription>
      </Alert>
    </div>

    <div v-else-if="sortedSites.length === 0" class="empty-state">
      <Alert variant="default" class="max-w-md mx-auto">
        <AlertDescription>
          <p>{{ t('overview.noSearchResults') }}</p>
        </AlertDescription>
      </Alert>
    </div>

    <div v-else class="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
      <SiteCard
        v-for="site in sortedSites"
        :key="site.id"
        :siteId="site.id"
        :host="site.host"
        :visitData="site.visit"
        :echartsData="site.echarts"
        :loading="false"
        :pinned="pinnedStore.isPinned(site.id)"
        @select="(id: string) => $emit('select-site', id)"
        @pin="pinnedStore.pin"
        @unpin="pinnedStore.unpin"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SiteCard from "./SiteCard.vue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Clock, Search } from "lucide-vue-next";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from 'vue-i18n';
import { usePinnedCardsStore } from '@/stores/pinnedCards';

const { t } = useI18n();

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

import { ref, computed } from 'vue';

const pinnedStore = usePinnedCardsStore()
const searchQuery = ref('')

const sortedSites = computed(() => {
  const pinned = pinnedStore.pinnedOrder
  const pinnedSites: SiteOverview[] = []
  const unpinnedSites: SiteOverview[] = []

  let list = props.sites
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = props.sites.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        (s.host && s.host.toLowerCase().includes(q)),
    )
  }

  for (const site of list) {
    if (pinned.includes(site.id)) {
      pinnedSites.push(site)
    } else {
      unpinnedSites.push(site)
    }
  }

  pinnedSites.sort((a, b) => pinned.indexOf(a.id) - pinned.indexOf(b.id))

  return [...pinnedSites, ...unpinnedSites]
})

const timeList = computed(() => [
  { name: t('time.today'), value: "today" },
  { name: t('time.yesterday'), value: "1d" },
  { name: t('time.last7days'), value: "7d" },
  { name: t('time.last30days'), value: "30d" },
  { name: t('time.last60days'), value: "60d" },
  { name: t('time.last90days'), value: "90d" }
]);
</script>

<style scoped>
.overview-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}

@media (min-width: 640px) {
  .overview-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0;
  }
}

.overview-header-left {
  flex: 1;
}

.overview-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

@media (min-width: 640px) {
  .overview-header-right {
    width: auto;
  }
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

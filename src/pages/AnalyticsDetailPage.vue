<template>
  <section class="content-section">
    <div class="analytics-detail">
      <div class="detail-controls">
        <div class="flex items-center gap-3">
          <a :href="`/${siteId}`" class="back-link">
            <ChevronLeft class="w-4 h-4" />
          </a>
          <h2 class="detail-title">{{ pageTitle }}</h2>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm text-[#52525b]">
            <Clock class="w-4 h-4" />
          </div>
          <Select :disabled="loading" :model-value="timeValue" @update:model-value="onTimeChange">
            <SelectTrigger class="w-[180px]">
              <SelectValue :placeholder="t('overview.selectPeriod')" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{{ t("cycle.time") }}</SelectLabel>
                <SelectItem :value="i.value" v-for="i in timeList" :key="i.name">{{ i.name }}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="analytics-list">
        <ScrollArea class="box-border h-full w-full pages-list" v-if="listData != undefined">
          <p class="page-item" v-for="(i, idx) in listData" :key="idx">
            <span :class="['line-clamp-1', dataType === 'ip' ? 'font-mono text-xs' : 'text-xs']">{{ i.name }}</span>
            <span class="line-clamp-1">{{ i.value }}</span>
            <em>{{ i.per }}<i :style="{ width: i.per }"></i></em>
          </p>
        </ScrollArea>
        <div class="space-y-4 pt-8 w-full" v-else>
          <Skeleton class="h-6 w-60" />
          <Skeleton class="h-6 w-80" />
          <Skeleton class="h-6 w-100" />
          <Skeleton class="h-6 w-60" />
          <Skeleton class="h-6 w-80" />
          <Skeleton class="h-6 w-100" />
          <Skeleton class="h-6 w-80" />
          <Skeleton class="h-6 w-full" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronLeft, Clock } from "@lucide/vue";
import { useI18n } from "vue-i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast/use-toast";
import vh from "vh-plugin";

const { toast } = useToast();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

interface ListItem {
  name: string;
  value: number | string;
  per?: string;
}

const siteId = computed(() => route.params.id as string);
const dataType = computed(() => route.params.type as string);
const timeValue = ref((route.query.time as string) || "today");
const loading = ref(false);
const listData = ref<ListItem[]>();

const pageTitle = computed(() => (dataType.value === "ip" ? t("analyticsDetail.ip") : t("analyticsDetail.userAgent")));

const timeList = computed(() => [
  { name: t("time.today"), value: "today" },
  { name: t("time.yesterday"), value: "1d" },
  { name: t("time.thisWeek"), value: "week" },
  { name: t("time.thisMonth"), value: "month" },
  { name: t("time.last7days"), value: "7d" },
  { name: t("time.last30days"), value: "30d" },
  { name: t("time.last60days"), value: "60d" },
  { name: t("time.last90days"), value: "90d" }
]);

const fetchData = async () => {
  listData.value = undefined;
  loading.value = true;
  vh.showLoading();

  try {
    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: dataType.value, siteID: siteId.value, time: timeValue.value })
    });
    const data = await res.json();
    if (data.code && data.code === 401) {
      window.location.reload();
      return;
    }
    if (!data.success) {
      toast({ description: data.message, variant: "destructive" });
      return;
    }
    listData.value = data.data;
  } finally {
    loading.value = false;
    vh.hideLoading();
  }
};

const onTimeChange = (v: string) => {
  timeValue.value = v;
  router.replace({ query: { time: v } });
};

watch(timeValue, () => fetchData(), { immediate: true });
</script>

<style scoped>
.analytics-detail {
  width: 100%;
  height: max-content;
}

.analytics-list {
  width: 100%;
  height: 520px;
}

.detail-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  padding-bottom: 24px;
}

.detail-controls > .flex.items-center:last-child {
  margin-left: auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #a1a1aa;
  text-decoration: none;
  transition: all 0.15s;
}

.back-link:hover {
  color: #4f6ef7;
  background: #f5f6fc;
}

:root.dark .back-link:hover {
  background: #27272a;
  color: #8b9cf7;
}

.detail-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 700;
  color: #18181b;
  margin: 0;
}

:root.dark .detail-title {
  color: #f4f4f5;
}

.pages-list {
  width: 100%;
}

.page-item {
  position: relative;
  box-sizing: border-box;
  padding: 0 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 30px;
  font-size: 14px;
  transition: all 0.16s;
  z-index: 1;
}

.page-item em {
  position: relative;
  box-sizing: border-box;
  padding-left: 4px;
  flex-shrink: 0;
  height: calc(100% - 6px);
  border-left: 1px solid #d2defb;
  font-style: normal;
  font-size: 14px;
  color: #8e8e8e;
  z-index: 1;
}

.page-item em i {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  background: #eaeffe;
  opacity: 0.66;
  z-index: -1;
}

.page-item span {
  flex: 1;
  width: 100%;
}

.page-item span:nth-last-of-type(1) {
  flex: none;
  flex-shrink: 0;
  width: max-content;
  margin-left: auto;
}

.page-item:hover {
  background: #f5f6fc;
}

:root.dark .page-item em {
  border-left-color: #3f3f46;
  color: #6b7280;
}

:root.dark .page-item em i {
  background: rgba(111, 148, 241, 0.2);
}

:root.dark .page-item:hover {
  background: #18181b;
}
</style>

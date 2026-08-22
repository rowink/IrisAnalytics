<template>
  <section class="site-detail">
    <!-- Time selector -->
    <div class="detail-controls">
      <div class="stats-bar">
        <div class="stats-item">
          <span>{{ t("detail.views") }}</span>
          <div class="space-y-2" v-if="resData.visit.views === undefined">
            <Skeleton class="h-6 w-16" />
          </div>
          <p v-else>{{ resData.visit.views }}</p>
        </div>
        <div class="stats-item">
          <span>{{ t("detail.visitors") }}</span>
          <div class="space-y-2" v-if="resData.visit.visitor === undefined">
            <Skeleton class="h-6 w-16" />
          </div>
          <p v-else>{{ resData.visit.visitor }}</p>
        </div>
        <div class="stats-item">
          <span>{{ t("detail.visits") }}</span>
          <div class="space-y-2" v-if="resData.visit.visit === undefined">
            <Skeleton class="h-6 w-16" />
          </div>
          <p v-else>{{ resData.visit.visit }}</p>
        </div>
      </div>

      <div class="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="detail-title">
            {{ siteId }}
            <a v-if="host" :href="`https://${host}`" target="_blank" rel="noopener noreferrer" class="detail-link" @click.stop>
              <ExternalLink class="w-4 h-4" />
            </a>
          </h2>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-sm text-[#52525b]">
            <Clock class="w-4 h-4" />
          </div>
          <Select :disabled="getDatasStatus" :model-value="timeValue" @update:model-value="$emit('update:timeValue', $event)">
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
    </div>

    <!-- ECharts line chart -->
    <div ref="echartsDOM" class="data-view"></div>

    <!-- Pages & Referrers -->
    <div class="pt-6 grid md:grid-cols-2 sm:grid-cols-1">
      <Card class="box-border flex flex-col w-full h-[460px] overflow-hidden">
        <CardHeader>
          <CardTitle>{{ t("detail.pages") }}</CardTitle>
        </CardHeader>
        <CardContent class="box-border pt-0 w-full h-full overflow-hidden">
          <ScrollArea class="box-border p-2 pt-0 h-full w-full pages-list" v-if="resData.path != undefined">
            <p class="page-item group" v-for="(i, idx) in resData.path" :key="idx">
              <a
                v-if="pageUrl(i.name)"
                :href="pageUrl(i.name)"
                target="_blank"
                rel="noopener noreferrer"
                class="line-clamp-1 flex items-center gap-1.5 min-w-0 cursor-pointer hover:text-[#4f6ef7] transition-colors"
              >
                <span class="line-clamp-1 min-w-0">{{ i.name }}</span>
                <ExternalLink class="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <span v-else class="line-clamp-1">{{ i.name }}</span>
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
        </CardContent>
      </Card>

      <Card class="box-border flex flex-col w-full h-[460px] overflow-hidden">
        <CardHeader>
          <CardTitle>{{ t("detail.referrers") }}</CardTitle>
        </CardHeader>
        <CardContent class="box-border pt-0 w-full h-full overflow-hidden">
          <ScrollArea class="box-border p-2 pt-0 h-full w-full pages-list" v-if="resData.referrer != undefined">
            <p class="page-item" v-for="(i, idx) in resData.referrer" :key="idx">
              <img v-if="i.name" :src="getIconUrl(i.name)" />
              <a :href="i.name" target="_blank" rel="noopener noreferrer" class="line-clamp-1 cursor-pointer">
                {{ i.name || t("detail.none") }}
              </a>
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
        </CardContent>
      </Card>
    </div>

    <!-- Browsers, OS & Devices -->
    <div class="grid md:grid-cols-3 grid-cols-1">
      <Card class="box-border flex flex-col w-full h-[460px] overflow-hidden">
        <CardHeader>
          <CardTitle>{{ t("detail.browsers") }}</CardTitle>
        </CardHeader>
        <CardContent class="box-border pt-0 w-full h-full overflow-hidden">
          <ScrollArea class="box-border p-2 pt-0 h-full w-full pages-list" v-if="resData.soft != undefined">
            <p class="page-item" v-for="(i, idx) in resData.soft" :key="idx">
              <span class="line-clamp-1">{{ i.name }}</span>
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
        </CardContent>
      </Card>

      <Card class="box-border flex flex-col w-full h-[460px] overflow-hidden">
        <CardHeader>
          <CardTitle>{{ t("detail.os") }}</CardTitle>
        </CardHeader>
        <CardContent class="box-border pt-0 w-full h-full overflow-hidden">
          <ScrollArea class="box-border p-2 pt-0 h-full w-full pages-list" v-if="resData.os != undefined">
            <p class="page-item" v-for="(i, idx) in resData.os" :key="idx">
              <img class="os" :src="getIcon(i.name)" />
              <span class="line-clamp-1">{{ i.name }}</span>
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
        </CardContent>
      </Card>

      <Card class="box-border flex flex-col w-full h-[460px] overflow-hidden">
        <CardHeader>
          <CardTitle>{{ t("detail.devices") }}</CardTitle>
        </CardHeader>
        <CardContent class="box-border pt-0 w-full h-full overflow-hidden">
          <ScrollArea class="box-border p-2 pt-0 h-full w-full pages-list" v-if="resData.device != undefined">
            <p class="page-item" v-for="(i, idx) in resData.device" :key="idx">
              <span class="line-clamp-1">{{ i.name }}</span>
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
        </CardContent>
      </Card>
    </div>

    <!-- World Map & Areas -->
    <div class="grid md:grid-cols-3 grid-cols-1">
      <Card class="box-border flex flex-col md:col-span-2 col-span-1 w-full h-[460px] overflow-hidden" v-if="resData.area != undefined">
        <WorldMap :areaData="resData.area" />
      </Card>
      <Card class="box-border flex flex-col w-full h-[460px] overflow-hidden">
        <CardHeader>
          <CardTitle>{{ t("detail.countries") }}</CardTitle>
        </CardHeader>
        <CardContent class="box-border pt-0 w-full h-full overflow-hidden">
          <ScrollArea class="box-border p-2 pt-0 h-full w-full pages-list" v-if="resData.area != undefined">
            <p class="page-item" v-for="(i, idx) in resData.area" :key="idx">
              <img :src="getAreaIcon(i.code)" />
              <span class="line-clamp-1">{{ areaName(i.code) }}</span>
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
        </CardContent>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, markRaw } from "vue";
import * as echarts from "echarts";
import { Clock, ExternalLink } from "@lucide/vue";
import { useThemeStore } from "@/stores/theme";
import { useI18n } from "vue-i18n";
import WorldMap from "@/components/WorldMap.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast/use-toast";
import vh from "vh-plugin";

const { toast } = useToast();
const theme = useThemeStore();
const { t, te } = useI18n();

const props = defineProps<{
  siteId: string;
  timeValue: string;
  host?: string;
}>();

defineEmits<{
  "update:timeValue": [value: string];
}>();

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

// Data types
interface ListItem {
  name: string;
  value: number | string;
  per?: string;
}

interface AreaItem {
  name: string;
  code: string;
  value: number | string;
  per?: string;
}

interface VisitData {
  views?: number | string;
  visitor?: number | string;
  visit?: number | string;
}

interface SiteEchartsData {
  views: Array<{ name: string; value: number }>;
  visitors: Array<{ name: string; value: number }>;
}

interface SiteDetailData {
  visit: VisitData;
  path?: ListItem[];
  referrer?: ListItem[];
  os?: ListItem[];
  soft?: ListItem[];
  area?: AreaItem[];
  echarts?: SiteEchartsData;
  device?: ListItem[];
}

interface ChartData {
  dates: string[];
  views: (number | string)[];
  visitors: (number | string)[];
}

// Data state
const resData = ref<SiteDetailData>({ visit: {} });
const tempResData = ref<SiteDetailData>({ visit: {} });
const getDatasStatus = ref(false);

// ECharts
const echartsDOM = ref<HTMLDivElement>();
let canvasMain: echarts.ECharts | null = null;
const lastChartData = ref<ChartData>({ dates: [], views: [], visitors: [] });

const getIconUrl = (url: string) => {
  if (!url) return "https://icons.duckduckgo.com/ip3/none.ico";
  const _url = new URL(url);
  return `https://icons.duckduckgo.com/ip3/${_url.hostname}.ico`;
};

// 拼接页面完整链接：https://{host}{path}，host 缺失时返回空串（不渲染链接）
const pageUrl = (path: string) => (props.host ? `https://${props.host}${path}` : "");

// T1 = Tor exit node, XX = unknown country (see en.json area.T1 / area.XX)
const UNKNOWN_CODES = new Set(["T1", "XX"]);
const getIcon = (code: string) => `${location.origin}/icon/badge/${UNKNOWN_CODES.has(code) ? "XX" : code}.png`;

// Fallback to "Unknown" (area.XX) when the code has no official country translation (e.g. XK)
const areaName = (code: string) => (te(`area.${code}`) ? t(`area.${code}`) : t("area.XX"));

// Fallback to the XX badge when the code has no official country flag (e.g. XK)
const getAreaIcon = (code: string) => `${location.origin}/icon/badge/${UNKNOWN_CODES.has(code) || !te(`area.${code}`) ? "XX" : code}.png`;

function chartColors(isDark: boolean) {
  return {
    line: "#6F94F1",
    areaTop: isDark ? "rgba(111, 148, 241, 0.25)" : "#DAE4FF",
    areaBottom: isDark ? "rgba(9, 9, 11, 0)" : "#ffffff",
    visitorLine: "#5DA68F",
    visitorAreaTop: isDark ? "rgba(93, 166, 143, 0.2)" : "#D8EDE5",
    visitorAreaBottom: isDark ? "rgba(9, 9, 11, 0)" : "#ffffff",
    axisLabel: isDark ? "#6B7280" : "#959BAA",
    axisLine: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.56)",
    tooltipBg: isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255,255,255,0.9)",
    tooltipBorder: isDark ? "#3F3F46" : "#E4E4E7",
    tooltipText: isDark ? "#F4F4F5" : "#18181B"
  };
}

const renderEcharts = (dateList: string[], viewsList: (number | string)[], visitorsList: (number | string)[]) => {
  if (!canvasMain) return;
  lastChartData.value = { dates: dateList, views: viewsList, visitors: visitorsList };
  const c = chartColors(theme.isDark);
  const option = {
    legend: {
      data: [t("chart.views"), t("chart.visitors")],
      top: 0,
      left: "center",
      textStyle: { color: c.axisLabel, fontSize: 12 },
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8
    },
    grid: { left: "0", right: "0", bottom: "0", top: "30", containLabel: true },
    xAxis: {
      type: "category",
      data: dateList,
      axisLabel: { color: c.axisLabel },
      axisLine: { lineStyle: { color: c.axisLine, width: 2, type: "dashed" as const } }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: c.axisLabel },
      splitLine: { lineStyle: { color: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" } }
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText }
    },
    series: [
      {
        name: t("chart.views"),
        data: viewsList,
        type: "line",
        smooth: true,
        emphasis: { focus: "series" },
        lineStyle: { width: 2, color: c.line },
        showSymbol: false,
        areaStyle: {
          opacity: 1,
          color: {
            colorStops: [
              { offset: 0, color: c.areaTop },
              { offset: 1, color: c.areaBottom }
            ],
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            type: "linear",
            global: false
          }
        }
      },
      {
        name: t("chart.visitors"),
        data: visitorsList,
        type: "line",
        smooth: true,
        emphasis: { focus: "series" },
        lineStyle: { width: 2, color: c.visitorLine },
        showSymbol: false,
        areaStyle: {
          opacity: 1,
          color: {
            colorStops: [
              { offset: 0, color: c.visitorAreaTop },
              { offset: 1, color: c.visitorAreaBottom }
            ],
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            type: "linear",
            global: false
          }
        }
      }
    ]
  };
  canvasMain.setOption(option);
};

const getDatas = async () => {
  resData.value = { visit: {} };
  tempResData.value = { visit: {} };

  const pmsARR = ["visit", "path", "referrer", "os", "soft", "area", "echarts", "device"] as const;
  getDatasStatus.value = true;
  vh.showLoading();

  try {
    const promisesForEach = pmsARR.map(async (type) => {
      try {
        const pms = { type, siteID: props.siteId, time: props.timeValue };
        const res = await fetch("/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pms)
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
        if (type === "echarts") {
          const dates = data.data.views.map((i: { name: string; value: number }) => `${i.name}${["today", "1d"].includes(props.timeValue) ? t("time.hour") : t("time.day")}`);
          const views = data.data.views.map((i: { name: string; value: number }) => i.value);
          const visitors = data.data.visitors.map((i: { name: string; value: number }) => i.value);
          renderEcharts(dates, views, visitors);
          tempResData.value[type] = data.data;
        } else {
          tempResData.value[type] = data.data;
        }
      } catch (error) {
        console.log(error);
      }
    });

    await Promise.all(promisesForEach);
  } finally {
    getDatasStatus.value = false;
    vh.hideLoading();
    resData.value = { ...tempResData.value };
  }
};

// Watch for changes in siteId or timeValue
watch(
  () => [props.siteId, props.timeValue],
  () => {
    if (props.siteId) getDatas();
  },
  { immediate: false }
);

// Re-render chart on dark mode toggle
watch(
  () => theme.isDark,
  () => {
    if (lastChartData.value.dates.length) {
      renderEcharts(lastChartData.value.dates, lastChartData.value.views, lastChartData.value.visitors);
    }
  }
);

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  // Initialize ECharts
  if (echartsDOM.value) {
    canvasMain = markRaw(echarts.init(echartsDOM.value, null, { renderer: "svg", useDirtyRect: true }));
    resizeObserver = new ResizeObserver(() => canvasMain?.resize());
    resizeObserver.observe(echartsDOM.value);
  }
  // Fetch data on mount
  if (props.siteId) getDatas();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  canvasMain?.dispose();
  canvasMain = null;
});
</script>

<style scoped>
.site-detail {
  width: 100%;
  height: max-content;
}

.detail-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  padding-bottom: 24px;
}

.stats-bar {
  display: flex;
  gap: 24px;
  flex: 1 1 100%;
  order: 1;
}

.detail-controls > .flex.items-center {
  order: 0;
  margin-left: auto;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-width: 80px;
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

.detail-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #a1a1aa;
  transition: color 0.15s;
}

.detail-link:hover {
  color: #4f6ef7;
}

:root.dark .detail-title {
  color: #f4f4f5;
}

:root.dark .detail-link:hover {
  color: #8b9cf7;
}

.stats-item span {
  font-size: 13px;
  color: #a1a1aa;
  font-weight: 500;
}

.stats-item p {
  font-size: 20px;
  font-weight: 600;
  color: #18181b;
  line-height: 1;
}

.data-view {
  width: 100%;
  height: 200px;
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

.page-item img {
  flex-shrink: 0;
  height: 50%;
  width: auto;
  max-width: 21.5px;
  border: 1px solid rgb(225, 223, 223);
  object-fit: cover;
}

.page-item img.os {
  height: 60%;
}

.page-item:hover {
  background: #f5f6fc;
}

:root.dark .stats-item p {
  color: #f4f4f5;
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

:root.dark .page-item img {
  border-color: #3f3f46;
}

@media (max-width: 640px) {
  .stats-bar {
    justify-content: space-between;
    gap: 20px;
  }

  .stats-item p {
    font-size: 22px;
  }

  .stats-item span {
    font-size: 14px;
  }
}
</style>

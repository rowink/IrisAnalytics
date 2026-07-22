<template>
  <section class="site-detail">
    <!-- Time selector -->
    <div class="detail-controls">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 text-sm text-[#52525b]">
          <Clock class="w-4 h-4" />
          <span>{{ siteId }}</span>
        </div>
        <Select :disabled="getDatasStatus" :model-value="timeValue" @update:model-value="$emit('update:timeValue', $event)">
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

      <div class="stats-bar">
        <div class="stats-item">
          <span>Views</span>
          <div class="space-y-2" v-if="resData.visit.views === undefined">
            <Skeleton class="h-6 w-16 ml-auto" />
          </div>
          <p v-else>{{ resData.visit.views }}</p>
        </div>
        <div class="stats-item">
          <span>Visitors</span>
          <div class="space-y-2" v-if="resData.visit.visitor === undefined">
            <Skeleton class="h-6 w-16 ml-auto" />
          </div>
          <p v-else>{{ resData.visit.visitor }}</p>
        </div>
        <div class="stats-item">
          <span>Visits</span>
          <div class="space-y-2" v-if="resData.visit.visit === undefined">
            <Skeleton class="h-6 w-16 ml-auto" />
          </div>
          <p v-else>{{ resData.visit.visit }}</p>
        </div>
      </div>
    </div>

    <!-- ECharts line chart -->
    <div ref="echartsDOM" class="data-view"></div>

    <!-- Pages & Referrers -->
    <div class="pt-6 grid md:grid-cols-2 sm:grid-cols-1">
      <Card class="box-border flex flex-col w-full h-[460px] overflow-hidden">
        <CardHeader>
          <CardTitle>Pages</CardTitle>
        </CardHeader>
        <CardContent class="box-border pt-0 w-full h-full overflow-hidden">
          <ScrollArea class="box-border p-2 pt-0 h-full w-full pages-list" v-if="resData.path != undefined">
            <p class="page-item" v-for="(i, idx) in resData.path" :key="idx">
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
          <CardTitle>Referrers</CardTitle>
        </CardHeader>
        <CardContent class="box-border pt-0 w-full h-full overflow-hidden">
          <ScrollArea class="box-border p-2 pt-0 h-full w-full pages-list" v-if="resData.referrer != undefined">
            <p class="page-item" v-for="(i, idx) in resData.referrer" :key="idx">
              <img v-if="i.name" :src="getIconUrl(i.name)" />
              <a :href="i.name" target="_blank" rel="noopener noreferrer" class="line-clamp-1 cursor-pointer">
                {{ i.name || "(None)" }}
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

    <!-- Browsers, OS, Areas -->
    <div class="grid xl:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
      <Card class="box-border flex flex-col w-full h-[460px] overflow-hidden">
        <CardHeader>
          <CardTitle>Browsers</CardTitle>
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
          <CardTitle>OS</CardTitle>
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
          <CardTitle>Areas</CardTitle>
        </CardHeader>
        <CardContent class="box-border pt-0 w-full h-full overflow-hidden">
          <ScrollArea class="box-border p-2 pt-0 h-full w-full pages-list" v-if="resData.area != undefined">
            <p class="page-item" v-for="(i, idx) in resData.area" :key="idx">
              <img :src="getIcon(i.name)" />
              <span class="line-clamp-1">{{ i.code }}</span>
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
import { ref, watch, onMounted, onBeforeUnmount, markRaw } from "vue";
import * as echarts from "echarts";
import { Clock } from "lucide-vue-next";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast/use-toast";
import vh from "vh-plugin";

const { toast } = useToast();

const props = defineProps<{
  siteId: string;
  timeValue: string;
}>();

const emit = defineEmits<{
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

// Data state
const resData = ref<any>({ visit: {} });
const tempResData = ref<any>({ visit: {} });
const getDatasStatus = ref(false);

// ECharts
const echartsDOM = ref<HTMLDivElement>();
let canvasMain: echarts.ECharts | null = null;

const getIconUrl = (url: string) => {
  if (!url) return "https://icons.duckduckgo.com/ip3/none.ico";
  const _url = new URL(url);
  return `https://icons.duckduckgo.com/ip3/${_url.hostname}.ico`;
};

const getIcon = (code: string) => `${location.origin}/icon/${code}.png`;

const renderEcharts = (dateList: Array<any>, valueList: Array<any>) => {
  if (!canvasMain) return;
  const option = {
    grid: { left: "0", right: "0", bottom: "0", top: "10", containLabel: true },
    xAxis: {
      type: "category",
      data: dateList,
      axisLabel: { color: "#959BAA" },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.56)", width: 2, type: "dashed" } }
    },
    yAxis: { type: "value", axisLabel: { color: "#959BAA" } },
    tooltip: { trigger: "axis" },
    series: [
      {
        data: valueList,
        type: "line",
        smooth: true,
        emphasis: {
          focus: "series",
          itemStyle: { borderWidth: 2 },
          areaStyle: {
            color: {
              colorStops: [
                { offset: 0, color: "#DAE4FF" },
                { offset: 1, color: "#ffffff" }
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
        lineStyle: {
          width: 2,
          color: {
            colorStops: [{ offset: 1, color: "#6F94F1" }],
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            type: "linear",
            global: false
          }
        },
        showSymbol: false,
        areaStyle: {
          opacity: 1,
          color: {
            colorStops: [
              { offset: 0, color: "#DAE4FF" },
              { offset: 1, color: "#ffffff" }
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

  const pmsARR = ["visit", "path", "referrer", "os", "soft", "area", "echarts"];
  getDatasStatus.value = true;
  vh.showLoading();

  const session = localStorage.getItem("session") || "";

  try {
    const promisesForEach = pmsARR.map(async (type) => {
      try {
        const pms = { type, siteID: props.siteId, time: props.timeValue, session };
        const res = await fetch("/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pms)
        });
        const data = await res.json();
        if (data.code && data.code === 401) {
          localStorage.clear();
          window.location.reload();
          return;
        }
        if (!data.success) {
          toast({ description: data.message, variant: "destructive" });
          return;
        }
        tempResData.value[type] =
          type === "echarts"
            ? renderEcharts(
                data.data.map((i: any) => `${i.name}${["today", "1d"].includes(props.timeValue) ? "点" : "日"}`),
                data.data.map((i: any) => `${i.value}`)
              )
            : data.data;
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

onMounted(() => {
  // Initialize ECharts
  if (echartsDOM.value) {
    canvasMain = markRaw(echarts.init(echartsDOM.value, null, { renderer: "svg", useDirtyRect: true }));
    window.addEventListener("resize", () => canvasMain?.resize());
  }
  // Fetch data on mount
  if (props.siteId) getDatas();
});

onBeforeUnmount(() => {
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
  justify-content: space-between;
  padding-bottom: 24px;
}

.stats-bar {
  display: flex;
  gap: 24px;
  margin-right: 16px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 80px;
}

.stats-item span {
  font-size: 13px;
  color: #a1a1aa;
  font-weight: 500;
}

.stats-item p {
  font-size: 24px;
  font-weight: 700;
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
  width: 30px;
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
</style>

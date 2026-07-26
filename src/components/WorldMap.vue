<template>
  <div class="world-map-wrapper">
    <VChart :option="chartOption" autoresize class="world-map-chart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import VChart from "vue-echarts";
import * as echarts from "echarts";
import { useThemeStore } from "@/stores/theme";
import { useSettingsStore } from "@/stores/settings";
import worldGeoJson from "@surbowl/world-geo-json-zh/world.zh.json";

echarts.registerMap("world", worldGeoJson as any);

const codeToGeoName: Record<string, string> = {};
for (const feature of (worldGeoJson as any).features) {
  const p = feature.properties;
  if (p.iso_a2 && p.name) {
    codeToGeoName[p.iso_a2] = p.name;
  }
}

interface AreaItem {
  name: string;
  code: string;
  value: number | string;
  per?: string;
}

const props = defineProps<{
  areaData?: AreaItem[];
}>();

const theme = useThemeStore();
const settings = useSettingsStore();

function chartColors(isDark: boolean) {
  return {
    empty: isDark ? "#1f2937" : "#f0f2f5",
    border: isDark ? "#374151" : "#e5e7eb",
    label: isDark ? "#6B7280" : "#959Baa",
    tooltipBg: isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255,255,255,0.9)",
    tooltipBorder: isDark ? "#3F3F46" : "#E4E4E7",
    tooltipText: isDark ? "#F4F4F5" : "#18181B"
  };
}

const chartOption = computed(() => {
  const c = chartColors(theme.isDark);

  const mapData = (props.areaData || [])
    .filter((item) => item.code && item.code !== "-99")
    .map((item) => ({
      name: codeToGeoName[item.code] || item.code,
      value: Number(item.value) || 0,
      code: item.code
    }));

  const displayNames = new Intl.DisplayNames([settings.locale], { type: "region" });

  return {
    tooltip: {
      trigger: "item",
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText },
      formatter: (params: { name?: string; data?: { code?: string }; value?: number | string }) => {
        const code = params.data?.code;
        const name = code ? (displayNames.of(code.toUpperCase()) || code) : (params.name || "");
        const val = Number(params.value) || 0;
        return `${name}: ${val}`;
      }
    },
    visualMap: {
      show: false,
      min: 0,
      max: Math.max(...mapData.map((d) => d.value), 1),
      inRange: {
        color: theme.isDark
          ? ["#1a2332", "#2d4a6e", "#4a7cb5", "#6f94f1", "#93b0f7"]
          : ["#e8edf5", "#b8cce8", "#7da0d8", "#4f7ed4", "#2d5fc7"]
      },
      calculable: true
    },
    series: [
      {
        type: "map",
        map: "world",
        roam: true,
        selectedMode: false,
        label: { show: false },
        itemStyle: {
          areaColor: c.empty,
          borderColor: c.border,
          borderWidth: 0.5
        },
        emphasis: {
          label: { show: false },
          itemStyle: {
            areaColor: theme.isDark ? "#4a7cb5" : "#6f94f1"
          }
        },
        data: mapData
      }
    ]
  };
});
</script>

<style scoped>
.world-map-wrapper {
  width: 100%;
  border: 1px solid #e4e4e7;
  border-radius: calc(var(--radius) - 2px);

  background: hsl(var(--card));
}

:root.dark .world-map-wrapper {
  border-color: #27272a;
}

.world-map-chart {
  width: 100%;
  aspect-ratio: 2 / 1;
  min-height: 300px;
}
</style>

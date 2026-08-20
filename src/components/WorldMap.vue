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
import { useI18n } from "vue-i18n";
import worldGeoJson from "@surbowl/world-geo-json-zh/world.zh.json";

interface WorldGeoJson {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      name?: string;
      iso_a2?: string;
      [key: string]: unknown;
    };
    geometry: { type: "Polygon"; coordinates: number[][][] } | { type: "MultiPolygon"; coordinates: number[][][][] };
  }>;
}

const geoData = worldGeoJson as unknown as WorldGeoJson;

echarts.registerMap("world", geoData);

const geoNameToCode: Record<string, string> = {};
const codeToGeoName: Record<string, string> = {};
for (const feature of geoData.features) {
  const p = feature.properties;
  if (p.iso_a2 && p.name) {
    geoNameToCode[p.name] = p.iso_a2;
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
const { t, te } = useI18n();

const formatName = (code: string | undefined, fallbackName: string | undefined) => {
  if (code && te(`area.${code}`)) return t(`area.${code}`);
  return fallbackName || t("area.XX");
};

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

  return {
    tooltip: {
      trigger: "item",
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText },
      formatter: (params: { name?: string; data?: { code?: string }; value?: number | string }) => {
        const code = params.data?.code || (params.name ? geoNameToCode[params.name] : undefined);
        const name = formatName(code, params.name);
        const val = Number(params.value) || 0;
        return `${name}${val ? `: ${val}` : ""}`;
      }
    },
    visualMap: {
      show: false,
      min: 0,
      max: Math.max(...mapData.map((d) => d.value), 1),
      inRange: {
        color: theme.isDark ? ["#1a2332", "#2d4a6e", "#4a7cb5", "#6f94f1", "#93b0f7"] : ["#e8edf5", "#b8cce8", "#7da0d8", "#4f7ed4", "#2d5fc7"]
      },
      calculable: true
    },
    series: [
      {
        type: "map",
        map: "world",
        roam: true,
        selectedMode: false,
        label: {
          show: false,
          fontSize: 9,
          color: c.label
        },
        itemStyle: {
          areaColor: c.empty,
          borderColor: c.border,
          borderWidth: 0.5
        },
        emphasis: {
          label: {
            show: false,
            fontWeight: "bold",
            formatter: (params: { name?: string }) => {
              const code = params.name ? geoNameToCode[params.name] : undefined;
              return formatName(code, params.name);
            }
          },
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
  height: 100%;
  box-sizing: border-box;
  background: hsl(var(--card));
  display: flex;
  flex-direction: column;
}

.world-map-chart {
  width: 100%;
  flex: 1;
  min-height: 0;
}
</style>

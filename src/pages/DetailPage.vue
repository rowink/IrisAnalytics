<script setup lang="ts">
import { inject, computed, ref } from "vue";
import { useRoute } from "vue-router";
import type { Ref } from "vue";
import SiteDetail from "@/components/SiteDetail.vue";

interface SiteInfo {
  id: string;
  host: string;
}

const route = useRoute();
const timeValue = inject<Ref<string>>("timeValue")!;
const siteList = inject<Ref<SiteInfo[]>>("siteList", ref([]));
const siteId = computed(() => route.params.id as string);
const host = computed(() => {
  const site = siteList.value.find((s) => s.id === siteId.value);
  return site?.host || "";
});
</script>

<template>
  <section class="content-section">
    <SiteDetail :key="siteId + timeValue" :siteId="siteId" :host="host" :timeValue="timeValue" @update:timeValue="(v: string) => (timeValue = v)" />
  </section>
</template>

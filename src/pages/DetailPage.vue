<script setup lang="ts">
import { inject, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Ref } from 'vue'
import SiteDetail from '@/components/SiteDetail.vue'

const route = useRoute()
const timeValue = inject<Ref<string>>('timeValue')!
const siteId = computed(() => route.params.id as string)
</script>

<template>
  <section class="content-section">
    <SiteDetail
      :key="siteId + timeValue"
      :siteId="siteId"
      :timeValue="timeValue"
      @update:timeValue="(v: string) => timeValue = v"
    />
  </section>
</template>

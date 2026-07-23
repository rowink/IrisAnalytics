<script setup lang="ts">
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import type { Ref } from 'vue'
import OverviewGrid from '@/components/OverviewGrid.vue'

const router = useRouter()
const overviewSites = inject<Ref<any[]>>('overviewSites')!
const overviewLoading = inject<Ref<boolean>>('overviewLoading')!
const initialized = inject<Ref<boolean>>('initialized')!
const timeValue = inject<Ref<string>>('timeValue')!
</script>

<template>
  <section class="content-section">
    <OverviewGrid
      :sites="(overviewSites as any)"
      :loading="overviewLoading"
      :initialized="initialized"
      :timeValue="timeValue"
      @select-site="(id: string) => router.push(`/${id}`)"
      @update:timeValue="(v: string) => timeValue = v"
    />
  </section>
</template>

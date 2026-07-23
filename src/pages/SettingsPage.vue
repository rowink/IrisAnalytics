<script setup lang="ts">
import SettingsView from '@/components/SettingsView.vue'
</script>

<template>
  <SettingsView class="settings-full-page" />
</template>

<style scoped>
.settings-full-page {
  margin-left: 0 !important;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  min-height: calc(100vh - 56px);
}
</style>

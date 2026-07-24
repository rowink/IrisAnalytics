import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePinnedCardsStore = defineStore(
  'pinnedCards',
  () => {
    const pinnedOrder = ref<string[]>([])

    function pin(siteId: string) {
      if (!pinnedOrder.value.includes(siteId)) {
        pinnedOrder.value.push(siteId)
      }
    }

    function unpin(siteId: string) {
      pinnedOrder.value = pinnedOrder.value.filter((id) => id !== siteId)
    }

    const isPinned = computed(() => (siteId: string) => {
      return pinnedOrder.value.includes(siteId)
    })

    return { pinnedOrder, pin, unpin, isPinned }
  },
  {
    persist: {
      key: 'pinned-cards',
      storage: localStorage,
      pick: ['pinnedOrder'],
    },
  },
)

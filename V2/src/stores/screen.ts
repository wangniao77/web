import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useScreenStore = defineStore('screen', () => {
  const scale = ref(1)
  const refreshInterval = ref(5 * 60 * 1000)

  function setScale(value: number) {
    scale.value = value
  }

  return { scale, refreshInterval, setScale }
})

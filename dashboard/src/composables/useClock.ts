import { onMounted, onUnmounted, ref } from 'vue'

export function useClock() {
  const dateStr = ref('')
  const timeStr = ref('')
  const weekStr = ref('')

  const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

  function tick() {
    const now = new Date()
    dateStr.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
    timeStr.value = now.toLocaleTimeString('zh-CN', { hour12: false })
    weekStr.value = weeks[now.getDay()]!
  }

  let timer: ReturnType<typeof setInterval>

  onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
  })

  onUnmounted(() => {
    clearInterval(timer)
  })

  return { dateStr, timeStr, weekStr }
}

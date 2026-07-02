/**
 * Animated number count-up via GSAP.
 *
 * Motion personality: Corporate
 *   Duration: 800–1200ms (slower = gravitas for KPI numbers)
 *   Easing: power2.out
 */
import gsap from 'gsap'
import { onUnmounted, ref, type Ref } from 'vue'

export function useCountUp(target: Ref<number | null>, duration = 1.0) {
  const display = ref(0)
  let tween: gsap.core.Tween | null = null

  function start(from = 0) {
    const to = target.value
    if (to == null) return

    const proxy = { val: from }
    tween = gsap.to(proxy, {
      val: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        display.value = Math.round(proxy.val)
      },
    })
  }

  function kill() {
    tween?.kill()
    tween = null
  }

  onUnmounted(kill)

  return { display, start, kill }
}

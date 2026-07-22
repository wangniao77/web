import gsap from 'gsap'
import { computed, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

export interface CountUpOptions {
  duration?: number
  decimals?: number
  delay?: number
  autoplay?: boolean
}

export function useCountUp(source: MaybeRefOrGetter<number>, options: CountUpOptions = {}) {
  const {
    duration = 1.4,
    decimals = 0,
    delay = 0,
    autoplay = true,
  } = options

  const display = ref(0)
  const tweenState = { value: 0 }
  let tween: gsap.core.Tween | null = null

  const formatted = computed(() => {
    if (decimals > 0) return display.value.toFixed(decimals)
    return String(Math.round(display.value))
  })

  function play(extraDelay = 0) {
    tween?.kill()
    const target = toValue(source)
    tweenState.value = display.value
    tween = gsap.to(tweenState, {
      value: target,
      duration,
      delay: delay + extraDelay,
      ease: 'power2.out',
      overwrite: true,
      onUpdate() {
        display.value = tweenState.value
      },
    })
    return tween
  }

  function reset() {
    tween?.kill()
    display.value = 0
    tweenState.value = 0
  }

  if (autoplay) {
    onMounted(() => play())
    watch(() => toValue(source), () => play())
  }

  return { display, formatted, play, reset }
}

import gsap from 'gsap'
import { nextTick, onUnmounted } from 'vue'

const SELECTORS = {
  header: '.university-screen .uni-header-wrap',
  row1: '.university-grid .panel-row1',
  row2: '.university-grid .panel-row2',
} as const

export function useUniversityEntrance() {
  let ctx: gsap.Context | null = null

  async function play() {
    await nextTick()

    ctx = gsap.context(() => {
      gsap.fromTo(
        SELECTORS.header,
        { y: -36, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out' },
      )

      gsap.fromTo(
        SELECTORS.row1,
        { y: 32, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.38, stagger: 0.08, ease: 'power2.out', delay: 0.12 },
      )

      gsap.fromTo(
        SELECTORS.row2,
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.07, ease: 'power2.out', delay: 0.28 },
      )
    })
  }

  onUnmounted(() => {
    ctx?.revert()
  })

  return { play }
}

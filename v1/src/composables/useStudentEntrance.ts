import gsap from 'gsap'
import { nextTick, onUnmounted } from 'vue'

const SELECTORS = {
  header:      '.student-screen .header',
  row1:        '.student-grid .panel-row1',
  row2:        '.student-grid .panel-row2, .student-grid .stack-academic',
  row3:        '.student-grid .panel-row3',
  footer:      '.student-grid .cell-footer',
} as const

export function useStudentEntrance() {
  let mm: gsap.MatchMedia | null = null

  async function play() {
    await nextTick()

    mm = gsap.matchMedia()

    mm.add(
      { reduceMotion: '(prefers-reduced-motion: reduce)' },
      (ctx) => {
        const { reduceMotion } = ctx.conditions as { reduceMotion: boolean }

        if (reduceMotion) {
          gsap.set(
            [
              SELECTORS.header,
              SELECTORS.row1,
              SELECTORS.row2,
              SELECTORS.row3,
              SELECTORS.footer,
            ].join(','),
            { autoAlpha: 1 },
          )
          return
        }

        gsap.fromTo(
          SELECTORS.header,
          { y: -36, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out' },
        )

        gsap.fromTo(
          SELECTORS.row1,
          { y: 32, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.38,
            stagger: 0.08,
            ease: 'power2.out',
            delay: 0.12,
          },
        )

        gsap.fromTo(
          SELECTORS.row2,
          { x: -40, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.35,
            stagger: 0.07,
            ease: 'power2.out',
            delay: 0.28,
          },
        )

        gsap.fromTo(
          SELECTORS.row3,
          { y: 24, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.32,
            stagger: 0.05,
            ease: 'power2.out',
            delay: 0.38,
          },
        )

        gsap.fromTo(
          SELECTORS.footer,
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out', delay: 0.55 },
        )
      },
    )
  }

  onUnmounted(() => {
    mm?.revert()
  })

  return { play }
}

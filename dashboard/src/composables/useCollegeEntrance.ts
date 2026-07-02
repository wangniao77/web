/**
 * College cockpit entrance animation orchestration.
 *
 * Motion personality: Corporate (motion-design skill)
 *   Duration: 200–500ms | Easing: power2.out | Overshoot: 0–3%
 *
 * Rules (ui-animation skill):
 *   - Animate only transform + opacity (never layout props)
 *   - Stagger 40–80ms per item, total choreography < 600ms
 *   - Entrance direction matches spatial layout
 *   - Reduced motion: instant opacity-only
 */
import gsap from 'gsap'
import { nextTick, onUnmounted } from 'vue'

const SELECTORS = {
  header:      '.college-screen .header',
  leftPanels:  '.college-grid .area-left .panel',
  center:      '.college-grid .area-center',
  rightPanels: '.college-grid .area-right .panel',
  warning:     '.college-grid .area-warning .panel',
} as const

export function useCollegeEntrance() {
  let mm: gsap.MatchMedia | null = null

  async function play() {
    await nextTick()

    mm = gsap.matchMedia()

    mm.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        const { reduceMotion } = ctx.conditions as { reduceMotion: boolean }

        if (reduceMotion) {
          // Accessibility path: instant reveal, no motion
          gsap.set(
            [
              SELECTORS.header,
              SELECTORS.leftPanels,
              SELECTORS.center,
              SELECTORS.rightPanels,
              SELECTORS.warning,
            ].join(','),
            { autoAlpha: 1 },
          )
          return
        }

        // ── Full entrance choreography ───────────────────────

        // Phase 1: Header drops in
        gsap.fromTo(
          SELECTORS.header,
          { y: -36, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out' },
        )

        // Phase 2: Left column panels slide in from left
        gsap.fromTo(
          SELECTORS.leftPanels,
          { x: -48, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.38,
            stagger: 0.07,
            ease: 'power2.out',
            delay: 0.12,
          },
        )

        // Phase 3: Center hub scales up
        gsap.fromTo(
          SELECTORS.center,
          { scale: 0.9, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            duration: 0.55,
            ease: 'power2.out',
            delay: 0.2,
          },
        )

        // Phase 4: Right column panels slide in from right
        gsap.fromTo(
          SELECTORS.rightPanels,
          { x: 48, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.38,
            stagger: 0.07,
            ease: 'power2.out',
            delay: 0.25,
          },
        )

        // Phase 5: Warning bar slides up
        gsap.fromTo(
          SELECTORS.warning,
          { y: 28, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.35,
            ease: 'power2.out',
            delay: 0.42,
          },
        )
      },
    )
  }

  onUnmounted(() => {
    mm?.revert()
  })

  return { play }
}

import gsap from 'gsap'
import { nextTick, onUnmounted } from 'vue'

const SELECTORS = {
  header: '.student-screen .cockpit-header',
  row1: '.stu-tpl__top > *',
  row2: '.stu-tpl__kanban',
  scoreCore: '.stu-tpl__score .core-hero-core',
  miniCards: '.stu-tpl__score .core-orbit-metric',
  identityMgmt: '.sid__management-item',
  identityWarn: '.sid__warning',
  aiAssessment: '.aip__assessment',
  aiSignals: '.aip__signals article',
  aiTimeline: '.aip__timeline-item',
  devCards: '.development-card',
  devPagination: '.development-pagination button',
} as const

export function useStudentEntrance() {
  let mm: gsap.MatchMedia | null = null

  async function play() {
    await nextTick()

    mm?.revert()
    mm = gsap.matchMedia()
    mm.add({ reduceMotion: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { reduceMotion } = ctx.conditions as { reduceMotion: boolean }
      const all = Object.values(SELECTORS).join(',')

      if (reduceMotion) {
        gsap.set(all, { autoAlpha: 1, clearProps: 'transform,strokeDashoffset' })
        return
      }

      gsap.set(all, { autoAlpha: 1 })

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      tl.fromTo(
        SELECTORS.header,
        { y: -40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5 },
      )

      tl.fromTo(
        SELECTORS.row1,
        { y: 32, autoAlpha: 0, scale: 0.97 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.42, stagger: 0.08 },
        '-=0.2',
      )

      tl.fromTo(
        SELECTORS.row2,
        { y: 28, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.38 },
        '-=0.18',
      )

      // 勿对 core-hero-core / orbit 卡写 transform：会覆盖 CSS 居中与持续动效
      tl.fromTo(
        SELECTORS.scoreCore,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.55, ease: 'power2.out' },
        '-=0.12',
      )

      tl.fromTo(
        SELECTORS.miniCards,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.35, stagger: 0.06 },
        '-=0.45',
      )

      tl.fromTo(
        SELECTORS.identityMgmt,
        { y: 14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.28, stagger: 0.04 },
        '-=0.9',
      )

      tl.fromTo(
        SELECTORS.identityWarn,
        { scale: 0.9, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.3, stagger: 0.07, ease: 'back.out(2)' },
        '-=0.75',
      )

      tl.fromTo(
        SELECTORS.aiAssessment,
        { x: 24, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.4 },
        '-=0.7',
      )

      tl.fromTo(
        SELECTORS.aiSignals,
        { y: 12, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.28, stagger: 0.06 },
        '-=0.28',
      )

      tl.fromTo(
        SELECTORS.aiTimeline,
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.32, stagger: 0.08, clearProps: 'transform,opacity,visibility' },
        '-=0.2',
      )

      tl.fromTo(
        SELECTORS.devCards,
        { y: 22, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.34, stagger: 0.05 },
        '-=0.55',
      )

      tl.fromTo(
        SELECTORS.devPagination,
        { scale: 0.6, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.25, stagger: 0.05, ease: 'back.out(2)' },
        '-=0.35',
      )
    })
  }

  onUnmounted(() => {
    mm?.revert()
  })

  return { play }
}

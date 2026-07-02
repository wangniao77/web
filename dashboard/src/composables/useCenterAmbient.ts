/**
 * Center hub perpetual ambient effects via GSAP.
 *
 * Motion personality: Corporate ambient layer
 *   - Smooth, continuous, never distracting
 *   - Cyclic animations with organic variation
 */
import gsap from 'gsap'
import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export function useCenterAmbient(containerRef: Ref<HTMLElement | null>) {
  let mm: gsap.MatchMedia | null = null

  function start() {
    const el = containerRef.value
    if (!el) return

    mm = gsap.matchMedia()

    mm.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        const { reduceMotion } = ctx.conditions as { reduceMotion: boolean }
        if (reduceMotion) return

        // ── 1. Energy pulse waves ──────────────────────────
        const waves = el.querySelectorAll<HTMLElement>('.energy-wave')
        if (waves.length > 0) {
          const waveTl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 })

          waves.forEach((wave, i) => {
            waveTl.fromTo(
              wave,
              { scale: 0.3, autoAlpha: 0 },
              {
                scale: 1.6,
                autoAlpha: 0,
                duration: 2.8,
                ease: 'power2.out',
              },
              i * 0.55,
            )
          }, 0)
        }

        // ── 2. Scanning beam (smooth 360° rotation) ───────
        const beam = el.querySelector<HTMLElement>('.scan-beam')
        if (beam) {
          gsap.to(beam, {
            rotation: 360,
            duration: 10,
            repeat: -1,
            ease: 'none',
          })
        }

        // ── 3. Data nodes on bezier paths ──────────────────
        const nodes = el.querySelectorAll<HTMLElement>('.data-node')
        nodes.forEach((node, i) => {
          // Each node follows a slightly different elliptical orbit
          const orbit = gsap.timeline({ repeat: -1 })

          // Randomize horizontal vs vertical amplitude for organic feel
          const rx = 42 + (i % 3) * 8  // horizontal radius variation
          const ry = 38 + ((i * 7) % 5) * 6 // vertical radius variation
          const dur = 8 + i * 1.6

          // Build an elliptical path using sequential tweens
          orbit
            .to(node, {
              x: rx,
              y: 0,
              duration: dur * 0.25,
              ease: 'sine.inOut',
            })
            .to(node, {
              x: 0,
              y: ry,
              duration: dur * 0.25,
              ease: 'sine.inOut',
            })
            .to(node, {
              x: -rx,
              y: 0,
              duration: dur * 0.25,
              ease: 'sine.inOut',
            })
            .to(node, {
              x: 0,
              y: -ry,
              duration: dur * 0.25,
              ease: 'sine.inOut',
            })

          // Pulse the node itself
          gsap.to(node, {
            scale: 1.8,
            autoAlpha: 0.45,
            duration: 1.2 + i * 0.3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            repeatDelay: 0.3,
          })
        })

        // ── 4. Crosshair beam gentle pulse ─────────────────
        const hBeam = el.querySelector<HTMLElement>('.beam-h')
        const vBeam = el.querySelector<HTMLElement>('.beam-v')
        if (hBeam) {
          gsap.to(hBeam, {
            autoAlpha: 0.55,
            scaleX: 1.05,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }
        if (vBeam) {
          gsap.to(vBeam, {
            autoAlpha: 0.45,
            scaleY: 1.05,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.4,
          })
        }

        // ── 5. Dashed ring rotation (opposite directions) ──
        const ring1 = el.querySelector<HTMLElement>('.ring-2')
        const ring3 = el.querySelector<HTMLElement>('.ring-3')
        if (ring1) {
          gsap.to(ring1, {
            rotation: 360,
            duration: 40,
            repeat: -1,
            ease: 'none',
          })
        }
        if (ring3) {
          gsap.to(ring3, {
            rotation: -360,
            duration: 55,
            repeat: -1,
            ease: 'none',
          })
        }
      },
    )
  }

  onMounted(() => {
    // Wait for DOM + entrance animation to settle
    setTimeout(() => start(), 800)
  })

  onUnmounted(() => {
    mm?.revert()
  })

  return { start }
}

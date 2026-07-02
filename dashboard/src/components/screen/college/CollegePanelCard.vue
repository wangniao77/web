<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'

defineProps<{
  title: string
  icon?: string
  index?: number
  loading?: boolean
  error?: string | null
  showMore?: boolean
}>()

defineEmits<{ retry: [] }>()

// ── GSAP hover lift (Corporate: 250ms, power2.out) ───────────
const panelRef = ref<HTMLElement | null>(null)
let hoverTween: gsap.core.Tween | null = null

onMounted(() => {
  const el = panelRef.value
  if (!el) return

  el.addEventListener('mouseenter', () => {
    hoverTween?.kill()
    hoverTween = gsap.to(el, {
      y: -2,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  })

  el.addEventListener('mouseleave', () => {
    hoverTween?.kill()
    hoverTween = gsap.to(el, {
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  })
})

onUnmounted(() => {
  hoverTween?.kill()
})
</script>

<template>
  <section ref="panelRef" class="panel">
    <!-- Neon breathing edge glow -->
    <div class="panel-glow" />

    <header class="panel-header">
      <div class="header-left">
        <svg v-if="icon" class="header-icon" aria-hidden="true">
          <use :href="`/icons.svg#${icon}`" />
        </svg>
        <span v-if="index != null" class="panel-num">{{ String(index).padStart(2, '0') }}</span>
        <h3 class="panel-title">{{ title }}</h3>
      </div>
      <a v-if="showMore" class="panel-more" href="javascript:;">更多 &rsaquo;</a>
    </header>

    <div v-if="loading" class="panel-body panel-placeholder">
      <span class="spinner" /> 加载中...
    </div>
    <div v-else-if="error" class="panel-body panel-placeholder">
      <span>{{ error }}</span>
      <button type="button" @click="$emit('retry')">重试</button>
    </div>
    <div v-else class="panel-body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(12, 33, 72, 0.68) 0%, rgba(5, 15, 41, 0.72) 100%),
    rgba(4, 14, 38, 0.68);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(91, 196, 255, 0.13);
  border-radius: 8px;
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    inset 0 0 0 1px rgba(0, 229, 255, 0.025);
  transition: border-color $transition-base, background $transition-base, box-shadow $transition-base, transform $transition-base;

  &:hover {
    border-color: rgba(102, 217, 255, 0.28);
    background:
      linear-gradient(180deg, rgba(14, 39, 82, 0.76) 0%, rgba(6, 18, 47, 0.78) 100%),
      rgba(4, 14, 38, 0.74);
    box-shadow:
      0 12px 34px rgba(0, 0, 0, 0.38),
      0 0 22px rgba(0, 184, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.045);
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 34px;
    height: 34px;
    pointer-events: none;
    opacity: 0.55;
  }

  &::before {
    top: 0;
    left: 0;
    border-top: 1px solid rgba(102, 217, 255, 0.38);
    border-left: 1px solid rgba(102, 217, 255, 0.26);
    border-radius: 8px 0 0;
  }

  &::after {
    right: 0;
    bottom: 0;
    border-right: 1px solid rgba(240, 192, 64, 0.22);
    border-bottom: 1px solid rgba(240, 192, 64, 0.18);
    border-radius: 0 0 8px;
  }
}

// ── Breathing edge glow ──────────────────────────────────────
.panel-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.7;
  border-radius: $panel-radius;
  background:
    linear-gradient(90deg, transparent 0%, rgba(0, 229, 255, 0.045) 48%, transparent 100%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.028), transparent 32%);
  box-shadow: inset 0 0 32px rgba(0, 184, 255, 0.045);
  animation: panel-breathe 4s ease-in-out infinite;
  transition: opacity $transition-base;
}

.panel:hover .panel-glow {
  opacity: 1;
}

@keyframes panel-breathe {
  0%, 100% { box-shadow: inset 0 0 30px rgba(0, 184, 255, 0.035); }
  50%      { box-shadow: inset 0 0 54px rgba(0, 184, 255, 0.085); }
}

// Stagger breath delays per panel index
.panel:nth-child(1) .panel-glow { animation-delay: 0s; }
.panel:nth-child(2) .panel-glow { animation-delay: 0.8s; }
.panel:nth-child(3) .panel-glow { animation-delay: 1.6s; }
.panel:nth-child(4) .panel-glow { animation-delay: 2.4s; }
.panel:nth-child(5) .panel-glow { animation-delay: 3.2s; }
.panel:nth-child(6) .panel-glow { animation-delay: 4.0s; }
.panel:nth-child(7) .panel-glow { animation-delay: 4.8s; }

// ── Header ──────────────────────────────────────────────────
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  padding: 0 14px 0 15px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  border-bottom: 1px solid rgba(102, 217, 255, 0.075);
  background:
    linear-gradient(90deg, rgba(0, 184, 255, 0.12), transparent 58%),
    rgba(2, 9, 26, 0.18);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.header-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #42d8ff;
  opacity: 0.95;
  filter: drop-shadow(0 0 7px rgba(0, 184, 255, 0.32));
}

.panel-num {
  font-family: var(--college-font-number);
  font-size: $college-fs-meta;
  font-weight: 600;
  color: #77ddff;
  opacity: 0.95;
  letter-spacing: 0;
}

.panel-title {
  font-size: $college-fs-title;
  font-weight: 700;
  color: #f3f8ff;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-more {
  flex-shrink: 0;
  font-size: $college-fs-label;
  color: rgba(174, 198, 230, 0.58);
  text-decoration: none;
  padding: 2px 6px;
  border-radius: 3px;
  transition: color $transition-fast, background $transition-fast;

  &:hover {
    color: $color-accent-cyan;
    background: rgba(0, 184, 255, 0.08);
  }
}

// ── Body ────────────────────────────────────────────────────
.panel-body {
  flex: 1;
  padding: 12px 13px;
  min-height: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

// ── Placeholder ─────────────────────────────────────────────
.panel-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: $color-text-secondary;
  font-size: $college-fs-body;

  button {
    padding: 3px 14px;
    background: rgba(0, 184, 255, 0.08);
    border: 1px solid rgba(0, 184, 255, 0.2);
    color: $color-accent;
    cursor: pointer;
    border-radius: 4px;
    font-size: $college-fs-label;
    transition: background $transition-fast;

    &:hover { background: rgba(0, 184, 255, 0.15); }
  }
}

.spinner {
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,0.08);
  border-top-color: $color-accent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>

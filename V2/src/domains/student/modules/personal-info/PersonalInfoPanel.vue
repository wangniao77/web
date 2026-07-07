<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import StudentPanelBorder from '@/domains/student/components/StudentPanelBorder.vue'
import type { PersonalInfoVM, QualityVM } from '@/domains/student/types/view'

const props = defineProps<{
  data: PersonalInfoVM
  quality: QualityVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const avatarError = ref(false)

const LEVEL_ORDER: Record<string, number> = {
  国家级: 0,
  省级: 1,
  校级: 2,
  院级: 3,
}

const sortedAwards = computed(() =>
  [...(props.data.awards ?? [])].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9),
  ),
)

function levelClass(level: string) {
  if (level === '国家级') return 'lv-national'
  if (level === '省级') return 'lv-province'
  if (level === '校级') return 'lv-school'
  return 'lv-college'
}

// Single-row award carousel — rotate one honor at a time so the
// photo + info rows above are never squeezed.
const awardIndex = ref(0)
const currentAward = computed(() => {
  const list = sortedAwards.value
  return list.length ? list[awardIndex.value % list.length] : null
})

let awardTimer: ReturnType<typeof setInterval> | null = null

function stopCarousel() {
  if (awardTimer) {
    clearInterval(awardTimer)
    awardTimer = null
  }
}

function startCarousel() {
  stopCarousel()
  if (sortedAwards.value.length > 1) {
    awardTimer = setInterval(() => {
      awardIndex.value = (awardIndex.value + 1) % sortedAwards.value.length
    }, 3200)
  }
}

watch(
  sortedAwards,
  () => {
    awardIndex.value = 0
    startCarousel()
  },
  { immediate: true },
)

onBeforeUnmount(stopCarousel)

const infoRows = computed(() => [
  { label: '学号', value: props.data.studentId, icon: 'icon-qr' },
  { label: '学院', value: props.data.college, icon: 'icon-education' },
  { label: '专业', value: props.data.major, icon: 'icon-research' },
  { label: '年级', value: props.data.grade, icon: 'icon-people' },
  { label: '班主任', value: props.data.mentor, icon: 'icon-partnership' },
  { label: '辅导员', value: props.data.counselor, icon: 'icon-people' },
  { label: '宿舍', value: props.data.dormitory, icon: 'icon-platform' },
])

function onAvatarError() {
  avatarError.value = true
}
</script>

<template>
  <StudentPanelBorder variant="8">
    <CollegePanelCard
      :index="1"
      title="个人信息卡"
      :loading="loading"
      :error="error"
      @retry="$emit('retry')"
    >
      <div class="personal-info">
        <div class="pi-top">
          <div class="photo-col">
            <div class="photo-frame">
              <img
                v-if="data.avatarUrl && !avatarError"
                :src="data.avatarUrl"
                :alt="`${data.name} 照片`"
                class="photo-img"
                @error="onAvatarError"
              />
              <div v-else class="photo-fallback">
                <span>{{ data.name.slice(0, 1) }}</span>
              </div>
            </div>
          </div>

          <div class="info-col">
            <header class="info-header">
              <h4 class="name">{{ data.name }}</h4>
              <div v-if="quality.cadreRoles.length" class="roles">
                <span v-for="role in quality.cadreRoles" :key="role" class="role-tag">{{ role }}</span>
              </div>
            </header>

            <ul class="info-list">
              <li v-for="row in infoRows" :key="row.label" class="info-row">
                <span class="info-icon" aria-hidden="true">
                  <svg><use :href="`/icons.svg#${row.icon}`" /></svg>
                </span>
                <span class="info-label">{{ row.label }}</span>
                <em class="info-value">{{ row.value }}</em>
              </li>
            </ul>
          </div>
        </div>

        <section v-if="currentAward" class="awards">
          <header class="awards__head">
            <span class="awards__title">
              <svg class="awards__icon" aria-hidden="true"><use href="/icons.svg#icon-star" /></svg>
              荣誉奖励
              <em class="awards__count">{{ sortedAwards.length }}</em>
            </span>
            <div v-if="sortedAwards.length > 1" class="awards__dots">
              <i
                v-for="(a, i) in sortedAwards"
                :key="a.name"
                :class="{ 'is-active': i === awardIndex }"
              />
            </div>
          </header>
          <div class="awards__viewport">
            <Transition name="award-swap" mode="out-in">
              <div
                :key="currentAward.name"
                class="award-item"
                :class="levelClass(currentAward.level)"
              >
                <span class="award-item__badge" aria-hidden="true">
                  <svg><use href="/icons.svg#icon-star" /></svg>
                </span>
                <span class="award-item__name">{{ currentAward.name }}</span>
                <span class="award-item__level">{{ currentAward.level }}</span>
                <time v-if="currentAward.date" class="award-item__date">{{ currentAward.date }}</time>
              </div>
            </Transition>
          </div>
        </section>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.personal-info {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.pi-top {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.4fr) minmax(0, 0.6fr);
  gap: 14px;
}

.photo-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.photo-frame {
  flex: 1;
  min-height: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 212, 255, 0.38);
  background: linear-gradient(160deg, rgba(0, 80, 140, 0.22), rgba(4, 14, 34, 0.75));
  box-shadow:
    0 0 20px rgba(0, 184, 255, 0.12),
    inset 0 0 30px rgba(0, 184, 255, 0.04);
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

.photo-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, rgba(0, 184, 255, 0.2), rgba(5, 14, 34, 0.65));

  span {
    font-size: 56px;
    font-weight: 700;
    color: rgba(226, 244, 255, 0.85);
  }
}

.info-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  min-width: 0;
}

.info-header {
  flex-shrink: 0;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.name {
  font-size: var(--fs-highlight);
  font-weight: 700;
  color: #f4f8ff;
  line-height: 1.2;
}

.roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.role-tag {
  font-size: var(--fs-meta);
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(240, 192, 64, 0.12);
  color: $color-accent-gold;
  border: 1px solid rgba(240, 192, 64, 0.2);
}

.info-list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-row {
  display: grid;
  grid-template-columns: 28px 58px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 1px 0;
  border-bottom: 1px solid rgba(0, 212, 255, 0.07);
  font-size: var(--fs-label);

  &:last-child {
    border-bottom: none;
  }
}

.info-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  background: rgba(0, 100, 180, 0.22);
  border: 1px solid rgba(0, 212, 255, 0.22);
  box-shadow: 0 0 8px rgba(0, 184, 255, 0.12);

  svg {
    width: 14px;
    height: 14px;
    color: #55dfff;
  }
}

.info-label {
  color: rgba(190, 210, 238, 0.78);
  white-space: nowrap;

  &::after {
    content: '：';
  }
}

.info-value {
  font-style: normal;
  color: #eef5ff;
  text-align: right;
  line-height: 1.35;
  word-break: break-all;
}

/* ── Awards ─────────────────────────────────────────── */
.awards {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 5px 9px;
  border-radius: 8px;
  background: linear-gradient(150deg, rgba(240, 192, 64, 0.08), rgba(4, 14, 34, 0.4));
  border: 1px solid rgba(240, 192, 64, 0.18);
}

.awards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.awards__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-meta);
  font-weight: 600;
  color: $color-accent-gold;
  letter-spacing: 0.03em;
}

.awards__icon {
  width: 14px;
  height: 14px;
  color: $color-accent-gold;
}

.awards__count {
  font-style: normal;
  font-family: var(--student-font-number, inherit);
  font-weight: 700;
  font-size: var(--fs-meta);
  color: $color-accent-gold;
  margin-left: 2px;
}

.awards__dots {
  display: flex;
  align-items: center;
  gap: 4px;

  i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(240, 192, 64, 0.28);
    transition: background 0.3s ease, width 0.3s ease;

    &.is-active {
      width: 12px;
      border-radius: 3px;
      background: $color-accent-gold;
    }
  }
}

.awards__viewport {
  position: relative;
  height: 34px;
  overflow: hidden;
}

.award-item {
  --lv-color: #{$color-accent-gold};
  --lv-soft: rgba(240, 192, 64, 0.12);
  height: 34px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 10px;
  border-radius: 7px;
  background: linear-gradient(120deg, var(--lv-soft), rgba(4, 14, 34, 0.3) 70%);
  border: 1px solid color-mix(in srgb, var(--lv-color) 28%, transparent);
  border-left: 3px solid var(--lv-color);

  &.lv-national {
    --lv-color: #ff9a6b;
    --lv-soft: rgba(255, 138, 90, 0.14);
  }

  &.lv-province {
    --lv-color: #{$color-accent-cyan};
    --lv-soft: rgba(0, 212, 255, 0.12);
  }

  &.lv-school {
    --lv-color: #{$color-accent-gold};
    --lv-soft: rgba(240, 192, 64, 0.12);
  }

  &.lv-college {
    --lv-color: #8fb6ff;
    --lv-soft: rgba(120, 160, 255, 0.12);
  }

  &__badge {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--lv-color) 40%, transparent), transparent 70%);
    border: 1px solid color-mix(in srgb, var(--lv-color) 45%, transparent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--lv-color) 30%, transparent);

    svg {
      width: 13px;
      height: 13px;
      color: var(--lv-color);
    }
  }

  &__name {
    flex: 1;
    min-width: 0;
    font-size: var(--fs-label);
    font-weight: 600;
    color: rgba(230, 242, 255, 0.94);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__level {
    flex-shrink: 0;
    font-size: var(--fs-micro);
    padding: 0 6px;
    line-height: 18px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--lv-color) 16%, transparent);
    color: var(--lv-color);
    white-space: nowrap;
  }

  &__date {
    flex-shrink: 0;
    font-size: var(--fs-meta);
    font-family: var(--student-font-number, inherit);
    color: rgba(190, 210, 238, 0.5);
    white-space: nowrap;
  }
}

// Carousel swap transition (vertical slide + fade)
.award-swap-enter-active,
.award-swap-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.award-swap-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.award-swap-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.award-swap-enter-active,
.award-swap-leave-active {
  position: absolute;
  inset: 0;
}
</style>

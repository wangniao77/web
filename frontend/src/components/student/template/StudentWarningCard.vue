<script setup lang="ts">
import { computed } from 'vue'
import StudentTplCard from './StudentTplCard.vue'
import type { AttentionItemVM } from '@/types/student/view'

const props = defineProps<{
  attention: AttentionItemVM[]
}>()

const items = computed(() => {
  const acad = props.attention.filter((a) => /学业|课程|挂科|GPA|补考/.test(a.category + a.label)).length
  const beh = props.attention.filter((a) => /实践|健康|行为|体测|心理/.test(a.category + a.label)).length
  const emp = props.attention.filter((a) => /就业|实习|职业/.test(a.category + a.label)).length
  return [
    { label: '学业预警', count: acad, ok: acad === 0 },
    { label: '行为预警', count: beh, ok: beh === 0 },
    { label: '就业预警', count: emp, ok: emp === 0 },
  ]
})

const risk = computed(() => {
  if (props.attention.some((a) => a.level === 'high')) return '中风险'
  return '低风险'
})
</script>

<template>
  <StudentTplCard icon="warning" title="预警摘要" class="stu-tpl__warning">
    <div class="sw">
      <div class="sw__hero">
        <div class="sw__text">
          <span>当前预警等级</span>
          <strong>{{ risk }}</strong>
        </div>
        <div class="sw__shield">
          <svg viewBox="0 0 80 88" aria-hidden="true">
            <path d="M40 6 L72 20 V44 C72 62 58 76 40 82 C22 76 8 62 8 44 V20 Z" fill="rgba(74,222,128,0.15)" stroke="#4ade80" stroke-width="2.5" />
            <path d="M28 44 L36 52 L54 34" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <div class="sw__stats">
        <div v-for="item in items" :key="item.label" class="sw__stat">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.8 5.7 21l2.3-7-6-4.6h7.6z" fill="currentColor" opacity="0.5"/>
          </svg>
          <div>
            <label>{{ item.label }}</label>
            <div class="sw__stat-row">
              <b>{{ item.count }}</b>
              <i :class="item.ok ? 'ok' : 'warn'">{{ item.ok ? '正常' : '需关注' }}</i>
            </div>
          </div>
        </div>
      </div>

      <p class="sw__more">更多预警情况见详情 →</p>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">
.sw {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sw__hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  min-height: 72px;
}

.sw__text {
  span {
    display: block;
    font-size: 13px;
    color: #8eb4d8;
    margin-bottom: 6px;
  }

  strong {
    font-size: 32px;
    font-weight: 800;
    color: #4ade80;
    letter-spacing: 0.08em;
    text-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
  }
}

.sw__shield {
  width: 64px;
  height: 70px;
  filter: drop-shadow(0 0 18px rgba(74, 222, 128, 0.5));
  svg { width: 100%; height: 100%; }
}

.sw__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.sw__stat {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 6px;
  border-radius: 8px;
  background: rgba(0, 40, 80, 0.35);

  svg {
    width: 14px;
    height: 14px;
    color: #6a9ec0;
    flex-shrink: 0;
    margin-top: 2px;
  }

  label {
    display: block;
    font-size: 11px;
    color: #8eb4d8;
    margin-bottom: 2px;
  }

  b {
    font-size: 18px;
    font-weight: 800;
    color: #e8f4ff;
    font-family: var(--student-font-number);
  }
}

.sw__stat-row {
  display: flex;
  align-items: center;
  gap: 6px;

  i {
    font-style: normal;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 999px;
    font-weight: 600;

    &.ok {
      color: #4ade80;
      background: rgba(74, 222, 128, 0.12);
    }

    &.warn {
      color: #fbbf24;
      background: rgba(251, 191, 36, 0.12);
    }
  }
}

.sw__more {
  margin: 0;
  text-align: right;
  font-size: 11px;
  color: rgba(142, 180, 216, 0.7);
  cursor: pointer;

  &:hover { color: #00ccff; }
}
</style>

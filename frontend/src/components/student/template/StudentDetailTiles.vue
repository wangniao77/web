<script setup lang="ts">
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import StudentTplCard from './StudentTplCard.vue'

const tiles: Array<{ id: string; label: string; sub: string; tone: string; icon: IconKind }> = [
  { id: 'academic', label: '学业详情', sub: '进入二级页面', tone: 'green', icon: 'academic' },
  { id: 'mental', label: '心理与成长详情', sub: '进入二级页面', tone: 'purple', icon: 'mental' },
  { id: 'warning', label: '预警与记录', sub: '进入二级页面', tone: 'orange', icon: 'warning' },
  { id: 'credit', label: '发展与学分建议', sub: '进入二级页面', tone: 'teal', icon: 'guide' },
]

defineEmits<{ open: [id: string] }>()
</script>

<template>
  <StudentTplCard icon="link" title="详情页入口" class="stu-tpl__tiles">
    <div class="dt">
      <button
        v-for="t in tiles"
        :key="t.id"
        type="button"
        class="dt__btn"
        :class="`dt__btn--${t.tone}`"
        @click="$emit('open', t.id)"
      >
        <span class="dt__glyph" aria-hidden="true">
          <DashIcon :kind="t.icon" :size="20" />
        </span>
        <span class="dt__text">
          <strong>{{ t.label }}</strong>
          <em>{{ t.sub }}</em>
        </span>
      </button>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">
.dt {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  height: 100%;
}

.dt__btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  }

  &--green {
    background: linear-gradient(135deg, rgba(20, 140, 80, 0.45), rgba(10, 60, 40, 0.55));
    border-color: rgba(74, 222, 128, 0.3);
  }

  &--purple {
    background: linear-gradient(135deg, rgba(100, 50, 200, 0.4), rgba(40, 20, 80, 0.55));
    border-color: rgba(167, 139, 250, 0.3);
  }

  &--orange {
    background: linear-gradient(135deg, rgba(200, 100, 20, 0.4), rgba(80, 40, 10, 0.55));
    border-color: rgba(251, 191, 36, 0.3);
  }

  &--teal {
    background: linear-gradient(135deg, rgba(20, 140, 120, 0.4), rgba(10, 60, 55, 0.55));
    border-color: rgba(52, 211, 153, 0.3);
  }
}

.dt__glyph {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.06);
}

.dt__text {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    color: #f0f8ff;
    font-size: 16px;
    font-weight: 700;
  }

  em {
    color: rgba(180, 210, 235, 0.7);
    font-size: 12px;
    font-style: normal;
  }
}
</style>

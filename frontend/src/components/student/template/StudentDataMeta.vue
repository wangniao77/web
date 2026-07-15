<script setup lang="ts">
import StudentTplCard from './StudentTplCard.vue'

const items = [
  { label: '数据来源', value: '教务系统、学工系统、心理中心、就业系统', icon: 'db' },
  { label: '最近更新', value: '2026-07-10 08:00:00', icon: 'clock' },
  { label: '更新频率', value: '每日自动同步', icon: 'sync' },
]
</script>

<template>
  <StudentTplCard icon="database" title="数据更新" class="stu-tpl__meta">
    <div class="meta">
      <div v-for="item in items" :key="item.label" class="meta__row">
        <span class="meta__icon">
          <svg v-if="item.icon === 'db'" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <svg v-else-if="item.icon === 'clock'" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <svg v-else viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3.5 9a9 9 0 0115-3.5L23 10M1 14l4.5 4.5A9 9 0 0020.5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </span>
        <div>
          <label>{{ item.label }}</label>
          <p>{{ item.value }}</p>
        </div>
      </div>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">
.meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  height: 100%;
}

.meta__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(0, 40, 80, 0.3);
}

.meta__icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00ccff;

  svg { width: 18px; height: 18px; }
}

label {
  display: block;
  font-size: 11px;
  color: #6a9ec0;
  margin-bottom: 2px;
  font-weight: 600;
}

p {
  margin: 0;
  font-size: 12px;
  color: #c8e0f0;
  line-height: 1.4;
}
</style>

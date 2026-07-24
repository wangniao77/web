<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import { exportActivePage, hasPageExport } from '@/composables/usePageExport'
import { collectDomTables } from '@/utils/collectDomTables'
import { downloadExcel, stampFilename } from '@/utils/exportExcel'

const props = defineProps<{
  title: string
  subtitle?: string
}>()

const router = useRouter()
const exporting = ref(false)
const bodyRef = ref<HTMLElement | null>(null)

function goBack() {
  router.push(ROUTES.college.root)
}

async function exportPageExcel() {
  if (exporting.value) return
  exporting.value = true
  try {
    if (hasPageExport()) {
      await exportActivePage()
      return
    }
    const sheets = collectDomTables(bodyRef.value || document)
    if (!sheets.length) {
      throw new Error('当前页暂无可导出的表格数据')
    }
    downloadExcel(stampFilename(props.title || '学院明细'), sheets)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : '导出失败')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="college-detail">
    <div class="college-detail__mesh" aria-hidden="true" />
    <header class="college-detail__header">
      <button type="button" class="college-detail__back" @click="goBack">← 返回驾驶舱</button>
      <div class="college-detail__title">
        <h1>{{ title }}</h1>
        <span v-if="subtitle">{{ subtitle }}</span>
      </div>
      <button
        type="button"
        class="college-detail__export"
        :disabled="exporting"
        title="导出当前页数据为 Excel"
        @click="exportPageExcel"
      >
        {{ exporting ? '导出中…' : '导出Excel' }}
      </button>
      <div class="college-detail__header-glow" aria-hidden="true" />
    </header>
    <main ref="bodyRef" class="college-detail__body">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.college-detail {
  position: relative;
  isolation: isolate;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 4px 10px;
  overflow: hidden;

  &::before {
    position: absolute;
    inset: -18px 0 auto;
    height: 180px;
    z-index: -2;
    pointer-events: none;
    background:
      linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.16), transparent),
      linear-gradient(180deg, rgba(16, 73, 132, 0.18), transparent);
    content: "";
  }
}

.college-detail__mesh {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    linear-gradient(rgba(0, 242, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 242, 255, 0.035) 1px, transparent 1px),
    linear-gradient(120deg, transparent 0 34%, rgba(139, 92, 246, 0.08) 34.2%, transparent 35% 100%);
  background-size: 36px 36px, 36px 36px, 100% 100%;
  opacity: 0.55;
}

.college-detail__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 70px;
  margin: 0 0 12px;
  padding: 10px 14px;
  overflow: hidden;
  border: 1px solid rgba(102, 217, 255, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(100deg, rgba(0, 184, 255, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(6, 22, 56, 0.82), rgba(3, 10, 30, 0.9));
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 0 28px rgba(0, 184, 255, 0.08);
  flex-shrink: 0;
}

.college-detail__header-glow {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.95), rgba(52, 211, 153, 0.65), transparent);
  box-shadow: 0 0 16px rgba(0, 242, 255, 0.55);
  pointer-events: none;
}

.college-detail__back {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid rgba(0, 242, 255, 0.32);
  background:
    linear-gradient(180deg, rgba(0, 184, 255, 0.14), rgba(4, 18, 48, 0.58)),
    rgba(0, 184, 255, 0.08);
  color: #8ef6ff;
  cursor: pointer;
  font-size: $college-fs-label;
  font-weight: 800;
  box-shadow: inset 0 0 14px rgba(0, 242, 255, 0.08);
  transition: border-color 0.2s, color 0.2s, box-shadow 0.2s, background 0.2s;

  &:hover {
    border-color: rgba(0, 242, 255, 0.72);
    background:
      linear-gradient(180deg, rgba(0, 242, 255, 0.22), rgba(4, 18, 48, 0.66)),
      rgba(0, 184, 255, 0.12);
    color: #ffffff;
    box-shadow: 0 0 18px rgba(0, 242, 255, 0.22), inset 0 0 16px rgba(0, 242, 255, 0.12);
  }
}

.college-detail__title {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1 1 auto;

  h1 {
    position: relative;
    margin: 0 0 4px;
    color: #f6fbff;
    font-size: 24px;
    line-height: 1.15;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-shadow: 0 0 16px rgba(0, 242, 255, 0.38);
  }

  span {
    font-size: $college-fs-label;
    color: rgba(184, 236, 255, 0.74);
  }
}

.college-detail__export {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  margin-left: auto;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid rgba(90, 190, 255, 0.45);
  background: linear-gradient(180deg, rgba(0, 120, 190, 0.28), rgba(4, 18, 48, 0.58));
  color: #b8f0ff;
  cursor: pointer;
  font-size: $college-fs-label;
  font-weight: 800;
  transition: border-color 0.2s, color 0.2s, background 0.2s;

  &:hover:not(:disabled) {
    border-color: rgba(120, 230, 255, 0.8);
    color: #ffffff;
    background: linear-gradient(180deg, rgba(0, 160, 230, 0.36), rgba(4, 18, 48, 0.7));
  }

  &:disabled {
    opacity: 0.65;
    cursor: wait;
  }
}

.college-detail__body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 2px 4px 18px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 242, 255, 0.28) transparent;
}

.college-detail__body :deep(.detail-placeholder) {
  display: grid;
  min-height: 220px;
  place-items: center;
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-radius: 8px;
  background: rgba(4, 14, 38, 0.38);
  color: rgba(184, 236, 255, 0.72);
  font-size: $college-fs-body;
}

.college-detail__body :deep(.detail-error) {
  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: 8px;
  background: rgba(68, 20, 36, 0.22);
}

.college-detail__body :deep(.summary-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.college-detail__body :deep(.summary-row span),
.college-detail__body :deep(.tag),
.college-detail__body :deep(.task-card header span) {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid rgba(0, 242, 255, 0.18);
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  color: #9eefff;
  font-weight: 800;
}

.college-detail__body :deep(.overview-row),
.college-detail__body :deep(.stat-grid) {
  gap: 12px;
}

.college-detail__body :deep(.overview-item),
.college-detail__body :deep(.stat-item),
.college-detail__body :deep(.task-card),
.college-detail__body :deep(.group) {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
}

.college-detail__body :deep(.overview-item::before),
.college-detail__body :deep(.stat-item::before),
.college-detail__body :deep(.task-card::before),
.college-detail__body :deep(.group::before) {
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  content: "";
}

.college-detail__body :deep(.overview-item span),
.college-detail__body :deep(.stat-item span) {
  color: rgba(184, 236, 255, 0.68);
}

.college-detail__body :deep(.overview-item strong),
.college-detail__body :deep(.stat-item strong) {
  color: #f4c84f;
  text-shadow: 0 0 12px rgba(240, 192, 64, 0.26);
}

.college-detail__body :deep(.module-desc),
.college-detail__body :deep(.task-desc),
.college-detail__body :deep(.task-meta),
.college-detail__body :deep(.bullet-list li) {
  color: rgba(218, 238, 255, 0.76);
}

.college-detail__body :deep(.task-card header h3),
.college-detail__body :deep(.group h3),
.college-detail__body :deep(.timeline strong) {
  color: #f6fbff;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
}

.college-detail__body :deep(.group) {
  padding: 12px;
}

.college-detail__body :deep(.table-wrap) {
  overflow: auto;
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-radius: 8px;
  background: rgba(2, 10, 30, 0.36);
}

.college-detail__body :deep(.detail-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: $college-fs-label;
}

.college-detail__body :deep(.detail-table th),
.college-detail__body :deep(.detail-table td) {
  padding: 11px 14px;
  border-bottom: 1px solid rgba(102, 217, 255, 0.09);
  text-align: left;
}

.college-detail__body :deep(.detail-table th) {
  color: #a8f0ff;
  font-weight: 900;
  background:
    linear-gradient(90deg, rgba(0, 184, 255, 0.13), rgba(0, 184, 255, 0.04)),
    rgba(4, 18, 48, 0.72);
}

.college-detail__body :deep(.detail-table td) {
  color: rgba(230, 246, 255, 0.88);
}

.college-detail__body :deep(.detail-table tbody tr:hover) {
  background: rgba(0, 184, 255, 0.08);
}

.college-detail__body :deep(.timeline li),
.college-detail__body :deep(.milestones li) {
  border: 1px solid rgba(102, 217, 255, 0.1);
  background: rgba(4, 18, 48, 0.46);
}

.college-detail__body :deep(.timeline em),
.college-detail__body :deep(.bullet-list li::before),
.college-detail__body :deep(.milestones li.done::before),
.college-detail__body :deep(.milestones li.done) {
  color: #63ffe1;
}
</style>

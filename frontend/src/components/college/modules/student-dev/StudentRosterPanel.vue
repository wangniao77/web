<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { RosterStudentDTO } from '@/api/college/details'
import { ROUTES } from '@/constants/routes'

const props = withDefaults(
  defineProps<{
    title: string
    students: RosterStudentDTO[]
    mode?: 'warning' | 'high-potential'
    loading?: boolean
    totalHint?: number
  }>(),
  {
    mode: 'warning',
    loading: false,
  },
)

const router = useRouter()

const filterText = ref('')
const filterClass = ref('')
const filterCounselor = ref('')
const filterMajor = ref('')
const filterGrade = ref('')
const filterLevel = ref('')

watch(
  () => props.students,
  () => {
    // 切换类别后保留搜索词，但清空维度筛选避免空表
    filterClass.value = ''
    filterCounselor.value = ''
    filterMajor.value = ''
    filterGrade.value = ''
    filterLevel.value = ''
  },
)

const isWarning = computed(() => props.mode === 'warning')

const classOptions = computed(() => Array.from(new Set(props.students.map((s) => s.className))))
const counselorOptions = computed(() => Array.from(new Set(props.students.map((s) => s.counselor))))
const majorOptions = computed(() => Array.from(new Set(props.students.map((s) => s.major))))
const gradeOptions = computed(() => Array.from(new Set(props.students.map((s) => s.grade))))
const levelOptions = computed(() =>
  Array.from(new Set(props.students.map((s) => s.warnLevel).filter((v): v is string => !!v))),
)

const rows = computed(() => {
  const kw = filterText.value.trim()
  return props.students
    .filter((s) => !filterClass.value || s.className === filterClass.value)
    .filter((s) => !filterCounselor.value || s.counselor === filterCounselor.value)
    .filter((s) => !filterMajor.value || s.major === filterMajor.value)
    .filter((s) => !filterGrade.value || s.grade === filterGrade.value)
    .filter((s) => !filterLevel.value || s.warnLevel === filterLevel.value)
    .filter(
      (s) =>
        !kw ||
        [s.name, s.studentId, s.className, s.counselor, s.dorm, s.major, s.phone].some((v) =>
          v.includes(kw),
        ),
    )
})

function resetFilters() {
  filterText.value = ''
  filterClass.value = ''
  filterCounselor.value = ''
  filterMajor.value = ''
  filterGrade.value = ''
  filterLevel.value = ''
}

function warningLevelClass(level: string) {
  if (level.includes('红') || level === '高') return 'lv-red'
  if (level.includes('橙') || level === '中') return 'lv-orange'
  return 'lv-yellow'
}

function goToStudentProfile(studentId: string) {
  router.push({ path: ROUTES.student, query: { studentId } })
}

defineExpose({
  setMajorFilter(major: string) {
    filterMajor.value = major
  },
  setGradeFilter(grade: string) {
    filterGrade.value = grade
  },
  resetFilters,
})
</script>

<template>
  <section class="roster-panel">
    <div class="roster-panel__head">
      <h3>
        {{ title }}
        <em>（重点样本 {{ rows.length }} / 共 {{ totalHint ?? students.length }} 人）</em>
      </h3>
      <slot name="headExtra" />
      <div class="roster-panel__filters">
        <input
          v-model="filterText"
          class="roster-panel__input"
          type="text"
          placeholder="搜索 姓名 / 学号 / 班级 / 专业 / 辅导员"
        />
        <select v-model="filterMajor" class="roster-panel__select">
          <option value="">全部专业</option>
          <option v-for="item in majorOptions" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="filterClass" class="roster-panel__select">
          <option value="">全部班级</option>
          <option v-for="item in classOptions" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="filterGrade" class="roster-panel__select">
          <option value="">全部年级</option>
          <option v-for="item in gradeOptions" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="filterCounselor" class="roster-panel__select">
          <option value="">全部辅导员</option>
          <option v-for="item in counselorOptions" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-if="isWarning" v-model="filterLevel" class="roster-panel__select">
          <option value="">全部等级</option>
          <option v-for="item in levelOptions" :key="item" :value="item">{{ item }}</option>
        </select>
        <button type="button" class="roster-panel__reset" @click="resetFilters">重置</button>
      </div>
    </div>

    <div v-if="loading" class="roster-panel__empty">名单加载中...</div>
    <div v-else class="roster-panel__scroll">
      <table class="roster-panel__table">
        <thead>
          <tr>
            <th class="col-idx">序号</th>
            <th>姓名</th>
            <th>性别</th>
            <th>学号</th>
            <th>班级</th>
            <th>专业</th>
            <th>年级</th>
            <th>政治面貌</th>
            <th>辅导员</th>
            <template v-if="isWarning">
              <th>预警原因</th>
              <th>等级</th>
            </template>
            <template v-else>
              <th>GPA</th>
              <th>亮点</th>
            </template>
            <th>联系电话</th>
            <th>宿舍号</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in rows" :key="s.id">
            <td class="col-idx">{{ i + 1 }}</td>
            <td class="cell-link" @click="goToStudentProfile(s.studentId)">{{ s.name }}</td>
            <td>{{ s.gender }}</td>
            <td class="cell-link" @click="goToStudentProfile(s.studentId)">{{ s.studentId }}</td>
            <td>{{ s.className }}</td>
            <td>{{ s.major }}</td>
            <td>{{ s.grade }}</td>
            <td>{{ s.political }}</td>
            <td>{{ s.counselor }}</td>
            <template v-if="isWarning">
              <td>{{ s.warnReason || '—' }}</td>
              <td>
                <em class="roster-level" :class="warningLevelClass(s.warnLevel || '')">{{ s.warnLevel || '—' }}</em>
              </td>
            </template>
            <template v-else>
              <td class="cell-gpa">{{ s.gpa.toFixed(2) }}</td>
              <td>{{ s.highlight }}</td>
            </template>
            <td>{{ s.phone }}</td>
            <td>{{ s.dorm }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="13" class="roster-panel__empty-cell">无匹配学生，可点击上方柱状图切换类别</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
.roster-panel {
  margin-top: 16px;
  padding: 14px 16px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 40, 90, 0.22);
}

.roster-panel__head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    color: #eaf7ff;

    em {
      margin-left: 8px;
      font-style: normal;
      font-size: 16px;
      font-weight: 600;
      color: #8ec8e8;
    }
  }
}

.roster-panel__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.roster-panel__input,
.roster-panel__select {
  min-height: 34px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.28);
  background: rgba(0, 40, 90, 0.45);
  color: #eaf7ff;
  font-size: 16px;
}

.roster-panel__input {
  min-width: 240px;
  flex: 1;
}

.roster-panel__select {
  min-width: 120px;
}

.roster-panel__reset {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.3);
  background: rgba(0, 100, 180, 0.25);
  color: #9fe8ff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: rgba(0, 140, 220, 0.35);
  }
}

.roster-panel__scroll {
  overflow: auto;
  max-height: 420px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 200, 255, 0.35) transparent;
}

.roster-panel__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 10px 12px;
    text-align: left;
    white-space: nowrap;
    font-weight: 700;
    color: #9fd6f5;
    background: rgba(0, 70, 140, 0.95);
    border-bottom: 1px solid rgba(0, 242, 255, 0.22);
  }

  tbody td {
    padding: 10px 12px;
    color: #d6e6f5;
    border-bottom: 1px solid rgba(0, 150, 255, 0.08);
    white-space: nowrap;
  }

  tbody tr:hover td {
    background: rgba(0, 120, 220, 0.1);
  }
}

.col-idx {
  width: 56px;
  text-align: center;
}

.cell-link {
  color: #7fe9ff;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    color: #c8fbff;
    text-decoration: underline;
  }
}

.cell-gpa {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: #ffd56a;
}

.roster-level {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 14px;
  font-style: normal;
  font-weight: 700;

  &.lv-red {
    color: #ff9b9b;
    background: rgba(220, 60, 60, 0.22);
    border: 1px solid rgba(255, 90, 90, 0.4);
  }

  &.lv-orange {
    color: #ffc19a;
    background: rgba(220, 120, 40, 0.22);
    border: 1px solid rgba(255, 150, 80, 0.4);
  }

  &.lv-yellow {
    color: #ffe08a;
    background: rgba(200, 160, 40, 0.2);
    border: 1px solid rgba(255, 210, 90, 0.35);
  }
}

.roster-panel__empty,
.roster-panel__empty-cell {
  padding: 28px 12px;
  text-align: center;
  color: #8eaec8;
  font-size: 18px;
}
</style>

<script setup lang="ts">
/**
 * 本学期课表（二级页面）
 *
 * 路由：/student/semester-schedule
 * 入口：基础信息台账中的「本学期课表 ›」按钮
 *
 * 内容：按星期 × 节次展示本学期全部课程，包含课程名、教师、教室、周次。
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await studentService.fetchDashboard(activeStudentId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

/* ── 课表数据结构 ── */

interface ScheduleItem {
  courseName: string
  teacher: string
  classroom: string
  weeks: string
}

const weekDays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'] as const
const periods = [
  { label: '第一二节', time: '08:00-09:40' },
  { label: '第三四节', time: '10:00-11:40' },
  { label: '第五六节', time: '14:00-15:40' },
  { label: '第七八节', time: '16:00-17:40' },
  { label: '第九十节', time: '18:00-19:40' },
  { label: '第十一十二节', time: '20:00-21:40' },
] as const

type WeekDay = typeof weekDays[number]
type PeriodLabel = typeof periods[number]['label']

/* ── 模拟课表数据（后续可替换为真实接口） ── */
const mockSchedule: Record<PeriodLabel, Partial<Record<WeekDay, ScheduleItem[]>>> = {
  '第一二节': {
    '星期一': [{ courseName: '网球', teacher: '袁武清', classroom: '田径场/风雨棚', weeks: '1-16周' }],
    '星期二': [
      { courseName: '软件设计模式', teacher: '胡建军副教授', classroom: '拓新楼201（计算机基础实验室）', weeks: '3,5,7,9,11,13,15周' },
      { courseName: '软件设计模式', teacher: '胡建军副教授', classroom: '拓新楼201', weeks: '2,4,6,8,10,12,14,16周' },
    ],
    '星期三': [{ courseName: '毛泽东思想和中国特色社会主义理论体系概论', teacher: '贺映捧', classroom: '笃行楼(S)21420', weeks: '1-10周' }],
  },
  '第三四节': {
    '星期二': [{ courseName: '操作系统', teacher: '陈铁梅副教授', classroom: '拓新楼302(S)1108', weeks: '2,16周' }],
    '星期三': [
      { courseName: '概率论与数理统计', teacher: '叶欣', classroom: '笃行楼(S)2303', weeks: '1-16周' },
    ],
    '星期四': [{ courseName: '职场英语', teacher: '皇思英讲师', classroom: '笃行楼(S)21314', weeks: '4-8周' }],
  },
  '第五六节': {
    '星期二': [{ courseName: '操作系统', teacher: '陈铁梅副教授', classroom: '拓新楼302（计算机基础实验室）', weeks: '4,6,8,10,12,14(双周)' }],
  },
  '第七八节': {
    '星期一': [
      { courseName: '软件构件与中间件技术', teacher: '罗东俊讲师', classroom: '拓新楼204（计算机基础实验室）', weeks: '1-16周' },
      { courseName: '形势与政策IV', teacher: '巫思敏教师', classroom: '拓新楼302', weeks: '6,5,11,13周' },
    ],
    '星期二': [
      { courseName: '软件构件与中间件技术', teacher: '罗东俊讲师', classroom: '拓新楼204（计算机基础实验室）', weeks: '5(单周)' },
    ],
    '星期四': [
      { courseName: 'Web开发技术II', teacher: '陈观雄讲师', classroom: '拓新楼302（计算机基础实验室）', weeks: '1-16(单周)' },
    ],
  },
  '第九十节': {
    '星期二': [{ courseName: '软件工程课程设计', teacher: '罗东俊讲师', classroom: '拓新楼302（计算机基础实验室）', weeks: '1-16(单周)' }],
    '星期四': [{ courseName: 'Web开发技术II', teacher: '陈观雄讲师', classroom: '拓新楼330（智慧教育云实验室）', weeks: '1-16(双周)' }],
  },
  '第十一十二节': {
    '星期一': [{ courseName: '概率论与数理统计', teacher: '叶欣', classroom: '笃行楼(S)2303', weeks: '1-16周' }],
    '星期二': [
      { courseName: '软件构件与中间件技术', teacher: '罗东俊讲师', classroom: '拓新楼204（计算机基础实验室）', weeks: '1-4,6-8,10-16(双周)' },
      { courseName: '软件工程课程设计', teacher: '罗东俊讲师', classroom: '拓新楼302（计算机基础实验室）', weeks: '1-16(单周)' },
    ],
    '星期三': [{ courseName: '中国近现代史纲要', teacher: '郑玉柱讲师', classroom: '笃行楼(S)1307', weeks: '1-16周' }],
  },
}

function getCourses(period: PeriodLabel, day: WeekDay): ScheduleItem[] {
  const list = mockSchedule[period]?.[day]
  return list ? list.filter(c => c.courseName && c.courseName !== '-') : []
}

function hasCourse(period: PeriodLabel, day: WeekDay): boolean {
  return getCourses(period, day).length > 0
}

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="本学期课表"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId} · ${dashboard.profile.className}` : ''"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载课表...
    </div>

    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span>
      <button type="button" @click="load">重试</button>
    </div>

    <div v-else class="schedule-page">
      <!-- 学期选择器 -->
      <div class="schedule-header">
        <span class="schedule-header__label">2025-2026-2 学期</span>
        <span class="schedule-header__tag">理论课表</span>
      </div>

      <!-- 课表主体 -->
      <div class="schedule-table-wrap">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="col-time">节次 / 时间</th>
              <th v-for="day in weekDays" :key="day" class="col-day">{{ day }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="period in periods" :key="period.label">
              <td class="cell-period">
                <div class="period-label">{{ period.label }}</div>
                <div class="period-time">{{ period.time }}</div>
              </td>
              <td
                v-for="day in weekDays"
                :key="day"
                class="cell-course"
                :class="{ 'cell-course--empty': !hasCourse(period.label, day) }"
              >
                <div
                  v-for="(course, idx) in getCourses(period.label, day)"
                  :key="idx"
                  class="course-card"
                >
                  <div class="course-card__name">{{ course.courseName }}</div>
                  <div class="course-card__meta">
                    <span v-if="course.teacher" class="course-card__teacher">{{ course.teacher }}</span>
                    <span v-if="course.classroom" class="course-card__room">{{ course.classroom }}</span>
                  </div>
                  <div v-if="course.weeks" class="course-card__weeks">{{ course.weeks }}</div>
                </div>
                <div v-if="!hasCourse(period.label, day)" class="course-empty">-</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 备注 -->
      <div class="schedule-note">
        <span class="schedule-note__label">备注：</span>
        未安排时间课程：湾区经济与社会实践调查 陈君君；
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.schedule-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Header */
.schedule-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);

  &__label {
    font-size: 18px;
    font-weight: 700;
    color: #f6fbff;
  }

  &__tag {
    padding: 3px 12px;
    border-radius: 3px;
    background: rgba(0, 184, 255, 0.12);
    border: 1px solid rgba(0, 212, 255, 0.25);
    color: #8ef6ff;
    font-size: 14px;
    font-weight: 700;
  }
}

/* Table wrap */
.schedule-table-wrap {
  border-radius: 5px;
  border: 1px solid rgba(102, 217, 255, 0.1);
  overflow: auto;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;

  th,
  td {
    border: 1px solid rgba(102, 217, 255, 0.12);
    vertical-align: top;
  }

  thead th {
    padding: 12px 8px;
    background: rgba(0, 38, 73, 0.55);
    color: #8edcff;
    font-weight: 700;
    font-size: 16px;
    text-align: center;
    white-space: nowrap;
  }

  .col-time {
    width: 110px;
    min-width: 110px;
  }

  .col-day {
    min-width: 140px;
  }
}

/* Period cell */
.cell-period {
  padding: 10px 8px;
  background: rgba(0, 38, 73, 0.35);
  text-align: center;

  .period-label {
    font-size: 16px;
    font-weight: 700;
    color: #d0e8f8;
    margin-bottom: 4px;
  }

  .period-time {
    font-size: 13px;
    color: #7eb4d8;
  }
}

/* Course cell */
.cell-course {
  padding: 10px;
  min-height: 60px;
  background: rgba(0, 38, 73, 0.18);

  &--empty {
    background: rgba(0, 38, 73, 0.08);
  }
}

.course-card {
  padding: 12px 14px;
  border-radius: 6px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.22);
  margin-bottom: 10px;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: rgba(0, 184, 255, 0.14);
    border-color: rgba(0, 212, 255, 0.45);
    box-shadow: 0 4px 12px rgba(0, 184, 255, 0.12);
  }

  &__name {
    font-size: 15px;
    font-weight: 700;
    color: #f6fbff;
    margin-bottom: 6px;
    line-height: 1.3;
    word-break: break-all;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 4px;
  }

  &__teacher {
    font-size: 13px;
    color: #9ecae8;
    word-break: break-all;
  }

  &__room {
    font-size: 13px;
    color: #7eb4d8;
    word-break: break-all;
  }

  &__weeks {
    font-size: 13px;
    color: #facc15;
    font-weight: 600;
  }
}

.course-empty {
  color: #5a7d96;
  font-size: 18px;
  text-align: center;
  padding: 20px 0;
}

/* Note */
.schedule-note {
  padding: 12px 16px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
  font-size: 15px;
  color: #b0d4e8;

  &__label {
    color: #78a9ca;
    font-weight: 700;
  }
}

/* Placeholder */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.7);
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-radius: 8px;
  background: rgba(4, 14, 38, 0.38);

  &.error { color: #f87171; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 13px;

    &:hover { background: rgba(0, 184, 255, 0.2); }
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00b8ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 1280px) {
  .schedule-table {
    font-size: 13px;
  }

  .course-card__name {
    font-size: 13px;
  }
}
</style>

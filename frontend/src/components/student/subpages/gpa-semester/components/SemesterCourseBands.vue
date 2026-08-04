<script setup lang="ts">
/**
 * 学期课程成绩总览（分学期列 · 课程名 + 分数色条）
 * 用于 gpa-semester 二级明细页顶部。
 */
import { computed } from 'vue'
import { CATEGORY_COLOR } from '../../_shared/gpa-data'
import type { CourseRecordVM } from '../../_shared/gpa-data'

const props = defineProps<{
  courses: CourseRecordVM[]
  semesters: string[]
}>()

const totalCount = computed(() => props.courses.filter((c) => c.counted).length)

const semesterBands = computed(() =>
  props.semesters.map((semester) => ({
    semester,
    courses: props.courses
      .filter((course) => course.semester === semester && course.counted)
      .sort((a, b) => b.score - a.score),
  })),
)
</script>

<template>
  <div class="bands-card">
    <header class="bands-card__head">
      <span class="bands-card__bar" aria-hidden="true" />
      <h3 class="bands-card__title">学期课程成绩</h3>
      <span class="bands-card__sub">共 {{ totalCount }} 门 · 颜色=类别 · 按成绩降序</span>
    </header>
    <div class="semester-bands">
      <div v-for="band in semesterBands" :key="band.semester" class="semester-band">
        <div class="semester-band__head">
          <span>{{ band.semester }}</span>
          <b>{{ band.courses.length }} 门</b>
        </div>
        <div class="semester-band__scores">
          <div
            v-for="course in band.courses"
            :key="course.id"
            class="semester-band__score"
            :style="{ '--score': `${course.score}%`, '--tone': CATEGORY_COLOR[course.category] }"
          >
            <span :title="course.name">{{ course.name }}</span>
            <strong>{{ course.score }}</strong>
            <i><em /></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bands-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 14px;
  border-radius: 8px;
  border: 1px solid rgba(102, 217, 255, 0.16);
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  overflow: hidden;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }
}

.bands-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.bands-card__bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
  flex-shrink: 0;
}

.bands-card__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
}

.bands-card__sub {
  margin-left: auto;
  font-size: 18px;
  color: rgba(184, 236, 255, 0.6);
}

.semester-bands {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  min-height: 0;
}

.semester-band {
  min-width: 0;
  max-height: 280px;
  padding: 12px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-radius: 8px;
  background: rgba(0, 37, 75, 0.24);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.semester-band__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  color: #bfeaff;
  font-size: 18px;
  font-weight: 800;
  flex-shrink: 0;

  b {
    color: #6fefff;
    font-size: 15px;
  }
}

.semester-band__scores {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  min-height: 0;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 184, 255, 0.35);
    border-radius: 4px;
  }
}

.semester-band__score {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
  gap: 6px;
  align-items: center;

  span {
    overflow: hidden;
    color: #a9cde4;
    font-size: 15px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  strong {
    color: var(--tone);
    font-family: 'DIN Alternate', sans-serif;
    font-size: 17px;
    text-align: right;
  }

  i {
    grid-column: 1 / -1;
    height: 5px;
    overflow: hidden;
    border-radius: 99px;
    background: rgba(101, 146, 183, 0.2);
  }

  em {
    display: block;
    width: var(--score);
    height: 100%;
    border-radius: inherit;
    background: var(--tone);
    box-shadow: 0 0 8px color-mix(in srgb, var(--tone) 55%, transparent);
  }
}
</style>

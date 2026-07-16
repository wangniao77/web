<script setup lang="ts">
import { computed } from 'vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import type { TeacherAnalyticsVM } from '@/types/college/view/teacher-analytics'

const props = defineProps<{
  data: TeacherAnalyticsVM
}>()

const titleMax = computed(() =>
  Math.max(...props.data.titleStructure.map((i) => i.count), 1),
)

function openTeacherDetail() {
  openCollegeDetail({ kind: 'teacher-detail' })
}
</script>

<template>
  <div class="faculty-atlas">
    <div class="faculty-atlas__metrics">
      <button type="button" class="faculty-atlas__metric" @click="openTeacherDetail">
        <span>专任教师</span>
        <strong>{{ data.summary.totalTeachers }}<small>人</small></strong>
      </button>
      <button type="button" class="faculty-atlas__metric" @click="openTeacherDetail">
        <span>博士占比</span>
        <strong>{{ data.summary.phdRatio }}<small>%</small></strong>
      </button>
      <button type="button" class="faculty-atlas__metric" @click="openTeacherDetail">
        <span>高级职称占比</span>
        <strong>{{ data.summary.seniorTitleRatio }}<small>%</small></strong>
      </button>
      <button type="button" class="faculty-atlas__metric" @click="openTeacherDetail">
        <span>平均学年课时</span>
        <strong>{{ data.summary.avgTeachingHours }}<small>学时</small></strong>
      </button>
      <button type="button" class="faculty-atlas__metric faculty-atlas__metric--accent" @click="openTeacherDetail">
        <span>教师标兵</span>
        <strong>{{ data.summary.modelTeacherCount }}<small>人</small></strong>
      </button>
      <button type="button" class="faculty-atlas__metric faculty-atlas__metric--warn" @click="openTeacherDetail">
        <span>年度预警</span>
        <strong>{{ data.summary.warningCount }}<small>人</small></strong>
      </button>
      <button type="button" class="faculty-atlas__metric faculty-atlas__metric--wide" @click="openTeacherDetail">
        <span>公共服务</span>
        <strong>
          {{ data.summary.publicService.count }}<small>次</small>
          <i>/</i>
          {{ data.summary.publicService.hours }}<small>小时</small>
        </strong>
      </button>
    </div>

    <div class="faculty-atlas__titles">
      <div class="faculty-atlas__titles-label">职称结构</div>
      <div class="faculty-atlas__titles-row">
        <div
          v-for="item in data.titleStructure"
          :key="item.title"
          class="faculty-atlas__title-item"
        >
          <span>{{ item.title }}</span>
          <strong>{{ item.count }}</strong>
          <i
            class="faculty-atlas__title-bar"
            :style="{ width: `${Math.round((item.count / titleMax) * 100)}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

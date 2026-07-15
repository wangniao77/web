<script setup lang="ts">
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import type { StudentFlowSankeyVM } from '@/types/college/view/student-dev-quality'

defineProps<{
  flowSankey: StudentFlowSankeyVM
  compact?: boolean
}>()

function openFlowDetail() {
  openCollegeDetail({ kind: 'student-flow' })
}
</script>

<template>
  <div class="student-flow-preview">
    <div class="student-flow-preview__columns">
      <section class="student-flow-preview__block student-flow-preview__block--in">
        <div class="student-flow-preview__head">
          <span class="student-flow-preview__tag student-flow-preview__tag--in">入口</span>
          <span class="student-flow-preview__title">高考录取</span>
        </div>
        <div class="student-flow-preview__metrics">
          <div>
            <span>招生总数</span>
            <strong>{{ flowSankey.summary.entranceTotal }}<small>人</small></strong>
          </div>
          <div>
            <span>录取均分</span>
            <strong>{{ flowSankey.summary.avgEntranceScore }}</strong>
          </div>
          <div>
            <span>一志愿率</span>
            <strong>{{ flowSankey.summary.firstChoiceRate }}%</strong>
          </div>
        </div>
        <ul class="student-flow-preview__list">
          <li v-for="item in flowSankey.summary.topEntranceRegions" :key="item.name">
            <span>{{ item.name }}</span>
            <strong>{{ item.count }}人</strong>
          </li>
        </ul>
      </section>

      <section class="student-flow-preview__block student-flow-preview__block--out">
        <div class="student-flow-preview__head">
          <span class="student-flow-preview__tag student-flow-preview__tag--out">出口</span>
          <span class="student-flow-preview__title">应届毕业去向</span>
        </div>
        <div class="student-flow-preview__metrics">
          <div>
            <span>毕业生数</span>
            <strong>{{ flowSankey.summary.graduateTotal }}<small>人</small></strong>
          </div>
          <div>
            <span>就业率</span>
            <strong>{{ flowSankey.summary.employmentRate }}%</strong>
          </div>
          <div>
            <span>升学率</span>
            <strong>{{ flowSankey.summary.furtherRate }}%</strong>
          </div>
        </div>
        <ul class="student-flow-preview__list">
          <li v-for="item in flowSankey.summary.topOutcomes" :key="item.name">
            <span>{{ item.name }}</span>
            <strong>{{ item.count }}人</strong>
          </li>
        </ul>
      </section>
    </div>

    <button v-if="!compact" type="button" class="student-flow-preview__action" @click="openFlowDetail">
      查看完整流向分析（桑基图） ›
    </button>
  </div>
</template>

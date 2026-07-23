<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AnalysisInsightPanel from '@/components/ai/AnalysisInsightPanel.vue'
import AgentFollowUpChat from '@/components/ai/AgentFollowUpChat.vue'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import { isWarningCategoryType } from '@/api/college/adapters/details'
import { collegeDetailService } from '@/api/college/services/details'
import { useAgentAnalysis } from '@/composables/useAgentAnalysis'
import { useScope } from '@/composables/useScope'
import type { AgentAnalyzeContextDTO } from '@/types/agent/api'
import type { WarningDetailVM } from '@/types/college/view/details'
import { aggregateWarningRecords } from '@/utils/agent/academic-risk-insights'

const route = useRoute()
const { collegeScope } = useScope()
const data = ref<WarningDetailVM | null>(null)
const loading = ref(true)

async function load() {
  const type = String(route.params.type ?? '')
  if (!isWarningCategoryType(type)) {
    data.value = null
    loading.value = false
    return
  }

  loading.value = true
  try {
    data.value = await collegeDetailService.fetchWarningDetail(type)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.type, load)

const agentContext = computed<AgentAnalyzeContextDTO | null>(() => {
  if (!data.value) return null
  const snapshot = aggregateWarningRecords(data.value)
  return {
    scope: 'college',
    page: 'academic-risk',
    collegeId: collegeScope.value.collegeId,
    filters: {
      warningType: data.value.type,
    },
    summarySnapshot: snapshot as unknown as Record<string, unknown>,
  }
})

const pageEnabled = computed(() => Boolean(data.value) && !loading.value)

const {
  analysis: agentAnalysis,
  loading: agentLoading,
  error: agentError,
  sessionId: agentSessionId,
  refresh: refreshAgentAnalysis,
  run: runAgentAnalysis,
} = useAgentAnalysis(agentContext, { enabled: pageEnabled, auto: true })
</script>

<template>
  <CollegeDetailLayout
    title="预警与风险监测"
    :subtitle="data ? `${data.label} · 名单明细` : '预警明细'"
  >
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <AnalysisInsightPanel
        class="risk-agent"
        :data="agentAnalysis"
        :loading="agentLoading"
        :error="agentError"
        @refresh="refreshAgentAnalysis"
        @retry="() => runAgentAnalysis(false)"
      />
      <AgentFollowUpChat
        v-if="agentContext"
        :session-id="agentSessionId"
        :context="agentContext"
        :disabled="agentLoading"
      />

      <div class="table-wrap">
        <h3 class="table-title">名单明细</h3>
        <table class="detail-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>学号</th>
              <th>专业</th>
              <th>年级</th>
              <th>预警原因</th>
              <th>等级</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data.records" :key="`${row.studentId}-${row.reason}`">
              <td>{{ row.name }}</td>
              <td>{{ row.studentId }}</td>
              <td>{{ row.major }}</td>
              <td>{{ row.grade }}</td>
              <td>{{ row.reason }}</td>
              <td>{{ row.level }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <div v-else class="detail-placeholder">未找到对应预警类别</div>
  </CollegeDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  color: rgba(174, 198, 230, 0.7);
}

.risk-agent {
  margin-bottom: 12px;
}

.table-title {
  margin: 16px 0 10px;
  font-size: 18px;
  color: #e8f7ff;
}

.table-wrap {
  overflow: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $college-fs-label;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.08);
    text-align: left;
  }

  th {
    color: rgba(174, 198, 230, 0.72);
    background: rgba(0, 184, 255, 0.06);
  }

  td {
    color: rgba(220, 232, 248, 0.88);
  }
}
</style>

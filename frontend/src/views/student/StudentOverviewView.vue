<script setup lang="ts">
import { onMounted, ref } from 'vue'
import StudentScreenLayout from '@/components/student/StudentScreenLayout.vue'
import PersonalInfoPanel from '@/components/student/modules/personal-info/PersonalInfoPanel.vue'
import GrowthRadarPanel from '@/components/student/modules/growth-radar/GrowthRadarPanel.vue'
import AiAssistantPanel from '@/components/student/modules/ai-assistant/AiAssistantPanel.vue'
import AcademicDevPanel from '@/components/student/modules/academic-dev/AcademicDevPanel.vue'
import CompetitionPanel from '@/components/student/modules/competition/CompetitionPanel.vue'
import InternshipPanel from '@/components/student/modules/internship/InternshipPanel.vue'
import StudentFooterBar from '@/components/student/modules/footer/StudentFooterBar.vue'
import StudentLoadingSkeleton from '@/components/student/StudentLoadingSkeleton.vue'
import { useStudentEntrance } from '@/composables/useStudentEntrance'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import '@/styles/student/student.scss'

const { studentScope } = useScope()
const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const { play: playEntrance } = useStudentEntrance()

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await studentService.fetchDashboard(studentScope.value.studentId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
    requestAnimationFrame(() => playEntrance())
  }
}

onMounted(loadAll)
useAutoRefresh(loadAll)
</script>

<template>
  <StudentScreenLayout v-if="dashboard">
    <div class="student-grid">
      <div class="cell-left-stack">
        <PersonalInfoPanel
          class="stack-personal panel-row1"
          :data="dashboard.profile"
          :quality="dashboard.quality"
          :loading="loading"
          :error="error"
          @retry="loadAll"
        />
        <AcademicDevPanel
          class="stack-academic panel-row2"
          :data="dashboard.academic"
          :loading="loading"
          :error="error"
          @retry="loadAll"
        />
      </div>

      <div class="cell-center-stack">
        <GrowthRadarPanel
          class="center-radar panel-row1"
          :data="dashboard.growthPortrait"
          :loading="loading"
          :error="error"
          @retry="loadAll"
        />

        <div class="cell-middle-pair">
          <InternshipPanel
            class="pair-intern panel-row2"
            :data="dashboard.internship"
            :loading="loading"
            :error="error"
            @retry="loadAll"
          />
          <CompetitionPanel
            class="pair-comp panel-row2"
            :data="dashboard.competition"
            :loading="loading"
            :error="error"
            @retry="loadAll"
          />
        </div>
      </div>

      <AiAssistantPanel
        class="cell-ai panel-row1"
        :data="dashboard.aiAssistant"
        :highlights="dashboard.highlights"
        :attention="dashboard.attention"
        :employment="dashboard.employment"
        :loading="loading"
        :error="error"
        @retry="loadAll"
      />

      <div class="cell-footer">
        <StudentFooterBar :data="dashboard.footer" />
      </div>
    </div>
  </StudentScreenLayout>
  <StudentLoadingSkeleton v-else-if="loading" />
  <div v-else-if="error" class="loading-screen">
    <span>{{ error }}</span>
    <button type="button" @click="loadAll">重试</button>
  </div>
</template>

<style scoped lang="scss">
.student-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: minmax(0, 1.36fr) minmax(0, 0.62fr) minmax(0, 0.62fr) 56px;
  gap: 12px;
}

.cell-left-stack {
  grid-row: 1 / 4;
  grid-column: 1 / span 2;
  display: grid;
  grid-template-rows: minmax(0, 0.52fr) minmax(0, 0.48fr);
  gap: 12px;
  min-height: 0;
}

.stack-personal,
.stack-academic {
  min-height: 0;
  min-width: 0;
}

.cell-center-stack {
  grid-row: 1 / 4;
  grid-column: 3 / span 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.center-radar {
  flex: 1.62 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.cell-ai {
  grid-row: 1 / 4;
  grid-column: 5 / span 2;
  min-height: 0;
  min-width: 0;
}

.cell-middle-pair {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pair-intern,
.pair-comp {
  min-height: 0;
  min-width: 0;
}

.cell-footer {
  grid-row: 4;
  grid-column: 1 / -1;
  min-height: 0;
}

.student-grid > * {
  min-height: 0;
  min-width: 0;
}

.loading-screen {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #020818;
  color: #8eb4d8;
  font-size: 16px;

  button {
    padding: 8px 20px;
    border-radius: 6px;
    border: 1px solid rgba(0, 212, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #00d4ff;
    cursor: pointer;
  }
}
</style>

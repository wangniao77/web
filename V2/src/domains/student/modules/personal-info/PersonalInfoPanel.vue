<script setup lang="ts">
import { computed, ref } from 'vue'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import StudentPanelBorder from '@/domains/student/components/StudentPanelBorder.vue'
import type { PersonalInfoVM, QualityVM } from '@/domains/student/types/view'

const props = defineProps<{
  data: PersonalInfoVM
  quality: QualityVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const avatarError = ref(false)

const infoRows = computed(() => [
  { label: '学号', value: props.data.studentId, icon: 'icon-qr' },
  { label: '学院', value: props.data.college, icon: 'icon-education' },
  { label: '专业', value: props.data.major, icon: 'icon-research' },
  { label: '年级', value: props.data.grade, icon: 'icon-people' },
  { label: '辅导员', value: props.data.counselor, icon: 'icon-partnership' },
  { label: '宿舍', value: props.data.dormitory, icon: 'icon-platform' },
])

function onAvatarError() {
  avatarError.value = true
}
</script>

<template>
  <StudentPanelBorder variant="8">
    <CollegePanelCard
      :index="1"
      title="个人信息卡"
      :loading="loading"
      :error="error"
      @retry="$emit('retry')"
    >
      <div class="personal-info">
        <div class="photo-col">
          <div class="photo-frame">
            <img
              v-if="data.avatarUrl && !avatarError"
              :src="data.avatarUrl"
              :alt="`${data.name} 照片`"
              class="photo-img"
              @error="onAvatarError"
            />
            <div v-else class="photo-fallback">
              <span>{{ data.name.slice(0, 1) }}</span>
            </div>
          </div>
        </div>

        <div class="info-col">
          <header class="info-header">
            <h4 class="name">{{ data.name }}</h4>
            <div v-if="quality.cadreRoles.length" class="roles">
              <span v-for="role in quality.cadreRoles" :key="role" class="role-tag">{{ role }}</span>
            </div>
          </header>

          <ul class="info-list">
            <li v-for="row in infoRows" :key="row.label" class="info-row">
              <span class="info-icon" aria-hidden="true">
                <svg><use :href="`/icons.svg#${row.icon}`" /></svg>
              </span>
              <span class="info-label">{{ row.label }}</span>
              <em class="info-value">{{ row.value }}</em>
            </li>
          </ul>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.personal-info {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.4fr) minmax(0, 0.6fr);
  gap: 14px;
}

.photo-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.photo-frame {
  flex: 1;
  min-height: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 212, 255, 0.38);
  background: linear-gradient(160deg, rgba(0, 80, 140, 0.22), rgba(4, 14, 34, 0.75));
  box-shadow:
    0 0 20px rgba(0, 184, 255, 0.12),
    inset 0 0 30px rgba(0, 184, 255, 0.04);
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}

.photo-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, rgba(0, 184, 255, 0.2), rgba(5, 14, 34, 0.65));

  span {
    font-size: 56px;
    font-weight: 700;
    color: rgba(226, 244, 255, 0.85);
  }
}

.info-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  min-width: 0;
}

.info-header {
  flex-shrink: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.name {
  font-size: $college-fs-highlight;
  font-weight: 700;
  color: #f4f8ff;
  line-height: 1.2;
}

.roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.role-tag {
  font-size: $college-fs-meta;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(240, 192, 64, 0.12);
  color: $color-accent-gold;
  border: 1px solid rgba(240, 192, 64, 0.2);
}

.info-list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-row {
  display: grid;
  grid-template-columns: 28px 52px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(0, 212, 255, 0.07);
  font-size: $college-fs-label;

  &:last-child {
    border-bottom: none;
  }
}

.info-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  background: rgba(0, 100, 180, 0.22);
  border: 1px solid rgba(0, 212, 255, 0.22);
  box-shadow: 0 0 8px rgba(0, 184, 255, 0.12);

  svg {
    width: 14px;
    height: 14px;
    color: #55dfff;
  }
}

.info-label {
  color: rgba(190, 210, 238, 0.78);
  white-space: nowrap;

  &::after {
    content: '：';
  }
}

.info-value {
  font-style: normal;
  color: #eef5ff;
  text-align: right;
  line-height: 1.35;
  word-break: break-all;
}
</style>

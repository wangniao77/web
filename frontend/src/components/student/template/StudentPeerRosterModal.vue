<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { StudentPeerItem } from '@/services/student/peers'

const props = defineProps<{
  open: boolean
  kind: 'class' | 'dorm' | null
  title: string
  subtitle?: string
  peers: StudentPeerItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  select: [studentId: string]
}>()

const avatarErrors = ref<Record<string, boolean>>({})

const kindLabel = computed(() => (props.kind === 'dorm' ? '同宿舍' : '同班级'))

watch(
  () => props.open,
  (open) => {
    if (open) avatarErrors.value = {}
  },
)

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

function markAvatarError(id: string) {
  avatarErrors.value = { ...avatarErrors.value, [id]: true }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="peer-modal" @click="onBackdrop">
      <div class="peer-modal__panel" role="dialog" aria-modal="true" :aria-label="title">
        <header>
          <div>
            <p class="peer-modal__eyebrow">{{ kindLabel }}名单</p>
            <h2>{{ title }}</h2>
            <p v-if="subtitle" class="peer-modal__sub">{{ subtitle }}</p>
          </div>
          <button type="button" aria-label="关闭" @click="emit('close')">×</button>
        </header>

        <div class="peer-modal__meta">
          共 <strong>{{ peers.length }}</strong> 人
          <span v-if="kind === 'dorm'">（同宿舍）</span>
          <span v-else>（同班级）</span>
        </div>

        <div class="peer-modal__body">
          <p v-if="loading" class="peer-modal__empty">正在加载名单…</p>
          <p v-else-if="!peers.length" class="peer-modal__empty">暂无同{{ kind === 'dorm' ? '宿舍' : '班' }}名单数据</p>
          <ul v-else>
            <li v-for="peer in peers" :key="peer.studentId">
              <button
                type="button"
                class="peer-row"
                :class="{ 'is-current': peer.isCurrent }"
                :disabled="peer.isCurrent"
                @click="emit('select', peer.studentId)"
              >
                <span class="peer-row__avatar">
                  <img
                    v-if="peer.avatarUrl && !avatarErrors[peer.studentId]"
                    :src="peer.avatarUrl"
                    :alt="peer.name"
                    @error="markAvatarError(peer.studentId)"
                  >
                  <em v-else>{{ peer.name.slice(0, 1) || '?' }}</em>
                </span>
                <span class="peer-row__main">
                  <strong>
                    {{ peer.name }}
                    <i v-if="peer.isCurrent">当前</i>
                  </strong>
                  <small>
                    {{ peer.studentId }}
                    <template v-if="peer.gender"> · {{ peer.gender }}</template>
                    <template v-if="kind === 'dorm' && peer.className"> · {{ peer.className }}</template>
                    <template v-if="kind === 'class' && peer.dormitory"> · {{ peer.dormitory }}</template>
                  </small>
                </span>
                <span class="peer-row__gpa">
                  <em>GPA</em>
                  <b>{{ peer.gpa != null ? peer.gpa.toFixed(2) : '—' }}</b>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.peer-modal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 8, 22, 0.72);
  backdrop-filter: blur(4px);
}

.peer-modal__panel {
  width: min(560px, 92vw);
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid rgba(0, 200, 255, 0.35);
  background: linear-gradient(165deg, rgba(8, 38, 78, 0.98), rgba(4, 18, 42, 0.98));
  box-shadow: 0 0 40px rgba(0, 140, 255, 0.25);
}

header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px 10px;
  border-bottom: 1px solid rgba(0, 200, 255, 0.15);

  h2 {
    margin: 2px 0 0;
    font-size: 18px;
    color: #e8f6ff;
    line-height: 1.35;
    word-break: break-all;
  }

  button {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: rgba(0, 80, 150, 0.35);
    color: #7ff6ff;
    font-size: 22px;
    cursor: pointer;
  }
}

.peer-modal__eyebrow {
  margin: 0;
  color: #67e8a3;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.peer-modal__sub {
  margin: 4px 0 0;
  color: #7aa4c0;
  font-size: 12px;
}

.peer-modal__meta {
  padding: 8px 18px;
  color: #8eb8d8;
  font-size: 13px;

  strong { color: #7ff6ff; }
}

.peer-modal__body {
  padding: 0 12px 14px;
  overflow-y: auto;
}

.peer-modal__empty {
  margin: 24px 12px;
  text-align: center;
  color: #7aa4c0;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.peer-row {
  width: 100%;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 180, 255, 0.14);
  border-radius: 8px;
  background: rgba(0, 45, 84, 0.28);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover:not(:disabled) {
    border-color: rgba(0, 220, 255, 0.4);
    background: rgba(0, 70, 120, 0.35);
  }

  &:disabled {
    cursor: default;
  }

  &.is-current {
    border-color: rgba(55, 233, 145, 0.45);
    background: rgba(12, 70, 48, 0.35);
  }
}

.peer-row__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(120, 210, 255, 0.35);
  background: #0a2748;

  img,
  em {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    object-fit: cover;
    font-style: normal;
    font-weight: 700;
    color: #7ff6ff;
  }
}

.peer-row__main {
  min-width: 0;

  strong {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #eef8ff;
    font-size: 15px;
  }

  i {
    padding: 1px 6px;
    border-radius: 3px;
    background: rgba(55, 233, 145, 0.18);
    color: #67e8a3;
    font-size: 11px;
    font-style: normal;
    font-weight: 700;
  }

  small {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    color: #7aa4c0;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.peer-row__gpa {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;

  em {
    color: #6f97b4;
    font-size: 11px;
    font-style: normal;
  }

  b {
    color: #7ff6ff;
    font-size: 16px;
    font-variant-numeric: tabular-nums;
  }
}
</style>

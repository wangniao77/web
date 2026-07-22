<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { AgentAnalyzeContextDTO } from '@/types/agent/api'
import type { AgentChatMessageVM } from '@/types/agent/view'
import { chatFollowUp } from '@/api/agent/services'

const props = defineProps<{
  sessionId: string
  context: AgentAnalyzeContextDTO
  disabled?: boolean
}>()

const input = ref('')
const messages = ref<AgentChatMessageVM[]>([])
const sending = ref(false)
const listRef = ref<HTMLElement | null>(null)
let abort: AbortController | null = null

watch(
  () => props.sessionId,
  () => {
    messages.value = []
    abort?.abort()
    abort = null
    sending.value = false
  },
)

async function scrollBottom() {
  await nextTick()
  const el = listRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function send() {
  const text = input.value.trim()
  if (!text || sending.value || props.disabled || !props.sessionId) return

  const userMsg: AgentChatMessageVM = {
    id: `u-${Date.now()}`,
    role: 'user',
    content: text,
  }
  const assistantId = `a-${Date.now()}`
  messages.value.push(userMsg, {
    id: assistantId,
    role: 'assistant',
    content: '',
    pending: true,
  })
  input.value = ''
  sending.value = true
  await scrollBottom()

  abort?.abort()
  abort = new AbortController()

  try {
    await chatFollowUp(
      {
        sessionId: props.sessionId,
        message: text,
        context: props.context,
      },
      (chunk) => {
        const msg = messages.value.find((m) => m.id === assistantId)
        if (!msg) return
        if (chunk.type === 'token' && chunk.content) {
          msg.content += chunk.content
          void scrollBottom()
        }
        if (chunk.type === 'error') {
          msg.content = chunk.error || '追问失败'
          msg.pending = false
        }
        if (chunk.type === 'done') {
          msg.pending = false
        }
      },
      abort.signal,
    )
  } catch (e: unknown) {
    const msg = messages.value.find((m) => m.id === assistantId)
    if (msg) {
      msg.content = e instanceof Error ? e.message : '追问失败'
      msg.pending = false
    }
  } finally {
    sending.value = false
    const msg = messages.value.find((m) => m.id === assistantId)
    if (msg) msg.pending = false
  }
}
</script>

<template>
  <section class="agent-chat">
    <header class="agent-chat__head">
      <h3>继续追问</h3>
      <p>基于当前详情页上下文，向 Agent 提问（如风险原因、督导建议）。</p>
    </header>

    <div ref="listRef" class="agent-chat__list">
      <div v-if="!messages.length" class="agent-chat__empty">暂无对话，可从洞察卡片出发继续下钻。</div>
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="agent-chat__bubble"
        :class="`agent-chat__bubble--${msg.role}`"
      >
        <span class="agent-chat__role">{{ msg.role === 'user' ? '你' : 'Agent' }}</span>
        <p>{{ msg.content || (msg.pending ? '…' : '') }}</p>
      </div>
    </div>

    <form class="agent-chat__form" @submit.prevent="send">
      <input
        v-model="input"
        type="text"
        placeholder="例如：最紧的任务下一步该怎么督？"
        :disabled="disabled || sending || !sessionId"
      />
      <button type="submit" :disabled="disabled || sending || !sessionId || !input.trim()">
        {{ sending ? '生成中' : '发送' }}
      </button>
    </form>
  </section>
</template>

<style scoped lang="scss">
.agent-chat {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(139, 92, 246, 0.28);
  background: rgba(12, 20, 48, 0.55);
  display: grid;
  gap: 12px;
}

.agent-chat__head {
  h3 {
    margin: 0;
    font-size: 17px;
    color: #f0fbff;
  }

  p {
    margin: 4px 0 0;
    font-size: 13px;
    color: rgba(184, 236, 255, 0.65);
  }
}

.agent-chat__list {
  max-height: 220px;
  overflow: auto;
  display: grid;
  gap: 8px;
  padding-right: 4px;
}

.agent-chat__empty {
  color: rgba(184, 236, 255, 0.5);
  font-size: 14px;
  padding: 12px 0;
}

.agent-chat__bubble {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(0, 40, 70, 0.45);

  p {
    margin: 4px 0 0;
    font-size: 14px;
    line-height: 1.5;
    color: rgba(220, 240, 255, 0.9);
    white-space: pre-wrap;
  }

  &--user {
    border-left: 3px solid rgba(56, 189, 248, 0.7);
  }

  &--assistant {
    border-left: 3px solid rgba(167, 139, 250, 0.8);
  }
}

.agent-chat__role {
  font-size: 12px;
  color: rgba(184, 236, 255, 0.55);
}

.agent-chat__form {
  display: flex;
  gap: 8px;

  input {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid rgba(0, 242, 255, 0.25);
    background: rgba(2, 18, 40, 0.8);
    color: #e8f7ff;
    outline: none;

    &:focus {
      border-color: rgba(0, 242, 255, 0.55);
    }
  }

  button {
    padding: 10px 16px;
    border-radius: 6px;
    border: 1px solid rgba(139, 92, 246, 0.45);
    background: rgba(76, 29, 149, 0.45);
    color: #f5f3ff;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>

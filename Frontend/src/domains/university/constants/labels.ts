import type { EventCategory, EventStatus } from '@/domains/university/types/api'

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  teaching: '教学培养',
  research: '科研学科',
  talent: '人才引育',
  service: '社会服务',
  international: '国际交流',
  safety: '校园安全',
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  completed: '已完成',
  ongoing: '推进中',
  planned: '待启动',
}

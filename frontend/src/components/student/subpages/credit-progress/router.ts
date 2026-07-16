/**
 * 学生端"学分完成率"二级页面 · 路由配置
 *
 * 路由：/student/credit-progress
 * 入口：AcademicDevPanel 点击 "学分完成率" KPI 卡
 */
import type { RouteRecordRaw } from 'vue-router'

const CreditProgress = () => import('./index.vue')

export const CREDIT_PROGRESS_ROUTE_PATH = 'credit-progress'

export const creditProgressRoutes: RouteRecordRaw[] = [
  {
    path: CREDIT_PROGRESS_ROUTE_PATH,
    name: 'student-credit-progress',
    component: CreditProgress,
    meta: {
      title: '学分进度',
      isStudentSubpage: true,
    },
  },
]

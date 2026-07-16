/**
 * 学生端 GPA · 学期课程明细 · 路由配置
 *
 * 路由：/student/gpa-semester
 * 入口：gpa-detail 页面底部"查看完整明细"卡片
 */
import type { RouteRecordRaw } from 'vue-router'

const GpaSemester = () => import('./index.vue')

export const GPA_SEMESTER_ROUTE_PATH = 'gpa-semester'

export const gpaSemesterRoutes: RouteRecordRaw[] = [
  {
    path: GPA_SEMESTER_ROUTE_PATH,
    name: 'student-gpa-semester',
    component: GpaSemester,
    meta: {
      title: '学期课程明细',
      isStudentSubpage: true,
    },
  },
]

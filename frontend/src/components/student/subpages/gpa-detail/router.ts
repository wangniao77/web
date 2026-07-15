/**
 * 学生端 GPA 二级页面（概览）· 路由配置
 *
 * 路由：/student/gpa-detail
 * 入口：一级页 AcademicDevPanel 点击 "绩点 GPA" KPI 卡
 *
 * 提取本文件夹时，把这段配置拷过去即可。
 */
import type { RouteRecordRaw } from 'vue-router'

const GpaDetail = () => import('./index.vue')

export const GPA_DETAIL_ROUTE_PATH = 'gpa-detail'

export const gpaDetailRoutes: RouteRecordRaw[] = [
  {
    path: GPA_DETAIL_ROUTE_PATH,
    name: 'student-gpa-detail',
    component: GpaDetail,
    meta: {
      title: 'GPA 详情',
      isStudentSubpage: true,
    },
  },
]

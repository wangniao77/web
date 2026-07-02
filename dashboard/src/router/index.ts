import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'portal',
      component: () => import('@/views/portal/PortalView.vue'),
    },
    {
      path: '/college',
      name: 'college',
      component: () => import('@/views/college/CollegeOverview.vue'),
    },
    {
      path: '/university',
      name: 'university',
      component: () => import('@/views/university/UniversityOverview.vue'),
    },
    {
      path: '/student',
      name: 'student',
      component: () => import('@/views/student/StudentOverview.vue'),
    },
  ],
})

export default router

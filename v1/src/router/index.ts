import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: ROUTES.portal,
      name: 'portal',
      component: () => import('@/views/portal/PortalView.vue'),
    },
    {
      path: ROUTES.college.root,
      component: () => import('@/views/college/CollegeShellView.vue'),
      children: [
        {
          path: '',
          name: 'college-overview',
          component: () => import('@/views/college/CollegeOverviewView.vue'),
        },
        {
          path: 'key-tasks',
          name: 'college-key-tasks',
          component: () => import('@/views/college/details/KeyTasksDetailView.vue'),
        },
        {
          path: 'high-potential/:moduleId',
          name: 'college-high-potential',
          component: () => import('@/views/college/details/HighPotentialDetailView.vue'),
        },
        {
          path: 'warning/:type',
          name: 'college-warning',
          component: () => import('@/views/college/details/WarningDetailView.vue'),
        },
        {
          path: 'teaching/courses',
          name: 'college-teaching-courses',
          component: () => import('@/views/college/details/TeachingCoursesDetailView.vue'),
        },
        {
          path: 'research/platforms',
          name: 'college-research-platforms',
          component: () => import('@/views/college/details/ResearchPlatformsDetailView.vue'),
        },
        {
          path: 'student/employment',
          name: 'college-student-employment',
          component: () => import('@/views/college/details/EmploymentDetailView.vue'),
        },
      ],
    },
    {
      path: ROUTES.university,
      name: 'university',
      component: () => import('@/views/university/UniversityOverview.vue'),
    },
    {
      path: ROUTES.student,
      name: 'student',
      component: () => import('@/views/student/StudentOverview.vue'),
    },
  ],
})

export default router

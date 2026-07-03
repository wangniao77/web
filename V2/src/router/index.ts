import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: ROUTES.portal,
      name: 'portal',
      component: () => import('@/portal/PortalView.vue'),
    },
    {
      path: ROUTES.college.root,
      component: () => import('@/domains/college/views/CollegeShellView.vue'),
      children: [
        {
          path: '',
          name: 'college-overview',
          component: () => import('@/domains/college/views/CollegeOverviewView.vue'),
        },
        {
          path: 'key-tasks',
          name: 'college-key-tasks',
          component: () => import('@/domains/college/views/details/KeyTasksDetailView.vue'),
        },
        {
          path: 'high-potential/:moduleId',
          name: 'college-high-potential',
          component: () => import('@/domains/college/views/details/HighPotentialDetailView.vue'),
        },
        {
          path: 'warning/:type',
          name: 'college-warning',
          component: () => import('@/domains/college/views/details/WarningDetailView.vue'),
        },
        {
          path: 'teaching/courses',
          name: 'college-teaching-courses',
          component: () => import('@/domains/college/views/details/TeachingCoursesDetailView.vue'),
        },
        {
          path: 'research/platforms',
          name: 'college-research-platforms',
          component: () => import('@/domains/college/views/details/ResearchPlatformsDetailView.vue'),
        },
        {
          path: 'student/employment',
          name: 'college-student-employment',
          component: () => import('@/domains/college/views/details/EmploymentDetailView.vue'),
        },
      ],
    },
    {
      path: ROUTES.university.root,
      component: () => import('@/domains/university/views/UniversityShellView.vue'),
      children: [
        {
          path: '',
          name: 'university-overview',
          component: () => import('@/domains/university/views/UniversityOverviewView.vue'),
        },
        {
          path: 'key-tasks',
          name: 'university-key-tasks',
          component: () => import('@/domains/university/views/details/KeyTasksDetailView.vue'),
        },
        {
          path: 'employment',
          name: 'university-employment',
          component: () => import('@/domains/university/views/details/EmploymentDetailView.vue'),
        },
        {
          path: 'news',
          name: 'university-news',
          component: () => import('@/domains/university/views/details/NewsDetailView.vue'),
        },
      ],
    },
    {
      path: ROUTES.student,
      name: 'student',
      component: () => import('@/domains/student/views/StudentOverviewView.vue'),
    },
  ],
})

export default router

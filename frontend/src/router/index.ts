import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '@/constants/routes'

function defaultEntryPath() {
  const view = import.meta.env.VITE_DEFAULT_VIEW
  if (view === 'college') return ROUTES.college.root
  if (view === 'university') return ROUTES.university.root
  if (view === 'student') return ROUTES.student
  return ROUTES.portal
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: defaultEntryPath,
    },
    {
      path: ROUTES.portal,
      name: 'portal',
      component: () => import('@/views/PortalView.vue'),
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
      path: ROUTES.university.root,
      component: () => import('@/views/university/UniversityShellView.vue'),
      children: [
        {
          path: '',
          name: 'university-overview',
          component: () => import('@/views/university/UniversityOverviewView.vue'),
        },
        {
          path: 'posture',
          name: 'university-posture',
          component: () => import('@/views/university/details/PostureDetailView.vue'),
        },
        {
          path: 'goals',
          name: 'university-goals',
          component: () => import('@/views/university/details/GoalsDetailView.vue'),
        },
        {
          path: 'benchmark',
          name: 'university-benchmark',
          component: () => import('@/views/university/details/BenchmarkDetailView.vue'),
        },
        {
          path: 'discipline-talent',
          name: 'university-discipline-talent',
          component: () => import('@/views/university/details/DisciplineTalentDetailView.vue'),
        },
        {
          path: 'research',
          name: 'university-research',
          component: () => import('@/views/university/details/ResearchDetailView.vue'),
        },
        {
          path: 'employment-risk',
          name: 'university-employment-risk',
          component: () => import('@/views/university/details/EmploymentRiskDetailView.vue'),
        },
        { path: 'tasks', redirect: { name: 'university-goals' } },
        { path: 'key-tasks', redirect: { name: 'university-goals' } },
        { path: 'disciplines', redirect: { name: 'university-discipline-talent' } },
        { path: 'teaching', redirect: { name: 'university-discipline-talent' } },
        { path: 'faculty', redirect: { name: 'university-discipline-talent' } },
        { path: 'employment', redirect: { name: 'university-employment-risk' } },
        { path: 'events', redirect: { name: 'university-employment-risk' } },
        { path: 'news', redirect: { name: 'university-employment-risk' } },
        { path: 'academic-risk', redirect: { name: 'university-employment-risk' } },
        {
          path: 'metrics',
          name: 'university-metrics',
          component: () => import('@/views/university/details/MetricsDetailView.vue'),
        },
      ],
    },
    {
      path: ROUTES.student,
      name: 'student',
      component: () => import('@/views/student/StudentOverviewView.vue'),
    },
  ],
})

export default router

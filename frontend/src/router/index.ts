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
  history: createWebHistory(import.meta.env.BASE_URL),
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
        {
          path: 'student/dev-detail',
          name: 'college-student-dev-detail',
          component: () => import('@/views/college/details/StudentDevDetailView.vue'),
        },
        {
          path: 'teacher/resource-base',
          name: 'college-teacher-resource-base',
          component: () => import('@/views/college/details/TeacherResourceBaseView.vue'),
        },
        {
          path: 'discipline/detail',
          name: 'college-discipline-detail',
          component: () => import('@/views/college/details/DisciplineDetailView.vue'),
        },
        {
          path: 'benchmark/detail',
          name: 'college-benchmark-detail',
          component: () => import('@/views/college/details/BenchmarkDetailView.vue'),
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
          path: 'research',
          name: 'university-research',
          component: () => import('@/views/university/details/ResearchDetailView.vue'),
        },
        {
          path: 'tasks',
          name: 'university-tasks',
          component: () => import('@/views/university/details/KeyTasksDetailView.vue'),
        },
        {
          path: 'key-tasks',
          redirect: { name: 'university-tasks' },
        },
        {
          path: 'disciplines',
          name: 'university-disciplines',
          component: () => import('@/views/university/details/DisciplineDetailView.vue'),
        },
        {
          path: 'employment',
          name: 'university-employment',
          component: () => import('@/views/university/details/EmploymentDetailView.vue'),
        },
        {
          path: 'events',
          name: 'university-events',
          component: () => import('@/views/university/details/EventsDetailView.vue'),
        },
        {
          path: 'news',
          redirect: { name: 'university-events' },
        },
        {
          path: 'academic-risk',
          name: 'university-academic-risk',
          component: () => import('@/views/university/details/AcademicRiskDetailView.vue'),
        },
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

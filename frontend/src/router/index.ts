import { createRouter, createWebHistory } from 'vue-router'
import { ROUTES } from '@/constants/routes'

function defaultEntryPath() {
  const view = import.meta.env.VITE_DEFAULT_VIEW
  if (view === 'college') return ROUTES.college.root
  if (view === 'university') return ROUTES.university.root
  if (view === 'student') return ROUTES.student.root
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
      path: ROUTES.student.root,
      name: 'student',
      component: () => import('@/views/student/StudentOverviewView.vue'),
    },
    {
      path: ROUTES.student.gpaDetail,
      name: 'student-gpa-detail',
      component: () => import('@/components/student/subpages/gpa-detail/index.vue'),
      meta: { title: 'GPA 详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.gpaSemester,
      name: 'student-gpa-semester',
      component: () => import('@/components/student/subpages/gpa-semester/index.vue'),
      meta: { title: '学期课程明细', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.creditProgress,
      name: 'student-credit-progress',
      component: () => import('@/components/student/subpages/credit-progress/index.vue'),
      meta: { title: '学分进度', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.failDetail,
      name: 'student-fail-detail',
      component: () => import('@/components/student/subpages/fail-detail/index.vue'),
      meta: { title: '挂科详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.basicLedger,
      name: 'student-basic-ledger',
      component: () => import('@/components/student/subpages/basic-ledger/index.vue'),
      meta: { title: '学生基础信息台账', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.psyWarning,
      name: 'student-psy-warning',
      component: () => import('@/components/student/subpages/psy-warning/index.vue'),
      meta: { title: '心理预警详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.academicWarning,
      name: 'student-academic-warning',
      component: () => import('@/components/student/subpages/academic-warning/index.vue'),
      meta: { title: '学业预警详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.employmentWarning,
      name: 'student-employment-warning',
      component: () => import('@/components/student/subpages/employment-warning/index.vue'),
      meta: { title: '就业预警详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.comprehensiveLedger,
      name: 'student-comprehensive-ledger',
      component: () => import('@/components/student/subpages/comprehensive-ledger/index.vue'),
      meta: { title: '综合素养台账详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.careerDevelopment,
      name: 'student-career-development',
      component: () => import('@/components/student/subpages/career-development/index.vue'),
      meta: { title: '出口发展详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.careerPathPostgrad,
      name: 'student-career-path-postgrad',
      component: () => import('@/components/student/subpages/career-development/index.vue'),
      meta: { title: '升学考研详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.careerPathJob,
      name: 'student-career-path-job',
      component: () => import('@/components/student/subpages/career-development/index.vue'),
      meta: { title: '就业详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.careerPathCivil,
      name: 'student-career-path-civil',
      component: () => import('@/components/student/subpages/career-development/index.vue'),
      meta: { title: '考公考编详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.academicDetail,
      name: 'student-academic-detail',
      component: () => import('@/components/student/subpages/academic-detail/index.vue'),
      meta: { title: '学情轨迹护航详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.growthPath,
      name: 'student-growth-path',
      component: () => import('@/components/student/subpages/growth-path/index.vue'),
      meta: { title: '成长路径完整方案', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.aiPortrait,
      name: 'student-ai-portrait',
      component: () => import('@/components/student/subpages/ai-portrait/index.vue'),
      meta: { title: '智能育航全景详情', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.graduationAudit,
      name: 'student-graduation-audit',
      component: () => import('@/components/student/subpages/graduation-audit/index.vue'),
      meta: { title: '毕业审核与毕设进度', isStudentSubpage: true },
    },
    {
      path: ROUTES.student.semesterSchedule,
      name: 'student-semester-schedule',
      component: () => import('@/components/student/subpages/semester-schedule/index.vue'),
      meta: { title: '本学期课表', isStudentSubpage: true },
    },
  ],
})

export default router

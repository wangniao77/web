export const ROUTES = {
  portal: '/',
  college: {
    root: '/college',
    keyTasks: '/college/key-tasks',
    highPotential: (moduleId: string) => `/college/high-potential/${moduleId}`,
    warning: (type: string) => `/college/warning/${type}`,
    teachingCourses: '/college/teaching/courses',
    researchPlatforms: '/college/research/platforms',
    studentEmployment: '/college/student/employment',
  },
  university: {
    root: '/university',
    keyTasks: '/university/key-tasks',
    employment: '/university/employment',
    news: '/university/news',
  },
  student: '/student',
} as const

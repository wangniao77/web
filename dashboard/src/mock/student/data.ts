import type { StudentProfileDTO } from '@/types/api/student'

export const mockStudentProfile: StudentProfileDTO = {
  name: '张明',
  studentId: '2021001001',
  college: '大数据与人工智能学院',
  major: '数据科学与大数据技术',
  grade: '2021级',
  growthIndex: 88.5,
  gpa: 3.72,
  credits: { earned: 142, required: 160 },
  warnings: [
    { type: 'academic', label: '学业', level: 'low' },
  ],
  achievements: [
    { label: '竞赛获奖', value: '3项' },
    { label: '志愿服务', value: '86小时' },
    { label: '创新创业', value: '1项' },
    { label: '实习经历', value: '2次' },
  ],
}

/**
 * 学生端挂科详情 · Mock 数据
 */
import type { FailCourseDTO, FailDetailDTO } from './types'

export const mockFailDetail: FailDetailDTO = {
  studentId: '2023001234',
  studentName: '张同学',
  major: '计算机科学与技术',
  grade: '2023级',

  courses: [
    // ── 2022秋 大一上 ──
    {
      id: 'f01', name: '高等数学 A', semester: '2022秋', semesterIndex: 1,
      score: 52, credit: 5, category: 'general', teacher: '李教授',
      classAvg: 68, classFailRate: 22, classTotal: 86, classFailCount: 19,
      required: true, riskLevel: 'mixed',
      analysis: '班级挂科率 22% 偏高，课程本身难度较大；该生 52 分远低于班均 68 分，基础薄弱需重点补强。',
    },
    {
      id: 'f02', name: 'C 语言程序设计', semester: '2022秋', semesterIndex: 1,
      score: 45, credit: 3, category: 'major-base', teacher: '王教授',
      classAvg: 72, classFailRate: 12, classTotal: 86, classFailCount: 10,
      required: true, riskLevel: 'student',
      analysis: '班均 72 分，挂科率仅 12%；该生 45 分属个人编程基础薄弱，建议安排助教辅导与上机练习。',
    },

    // ── 2023春 大一下 ──
    {
      id: 'f03', name: '大学物理 B', semester: '2023春', semesterIndex: 2,
      score: 38, credit: 4, category: 'general', teacher: '陈教授',
      classAvg: 55, classFailRate: 45, classTotal: 82, classFailCount: 37,
      required: true, riskLevel: 'course',
      analysis: '班级挂科率高达 45%，过半学生不及格；课程出卷偏难或教学方式需优化，非该生一人问题。',
    },
    {
      id: 'f04', name: '线性代数', semester: '2023春', semesterIndex: 2,
      score: 58, credit: 3, category: 'general', teacher: '赵教授',
      classAvg: 70, classFailRate: 15, classTotal: 82, classFailCount: 12,
      required: true, riskLevel: 'student',
      analysis: '距及格仅差 2 分（58 分），班均 70 分、挂科率 15%；学生复习不到位，建议补考冲刺。',
    },

    // ── 2023秋 大二上 ──
    {
      id: 'f05', name: '数据结构', semester: '2023秋', semesterIndex: 3,
      score: 48, credit: 4, category: 'major-core', teacher: '周教授',
      classAvg: 64, classFailRate: 28, classTotal: 80, classFailCount: 22,
      required: true, riskLevel: 'mixed',
      analysis: '专业核心课，班级挂科率 28% 偏中高；该生 48 分与班均 64 差距 16 分，编程逻辑与算法能力需加强。',
    },
    {
      id: 'f06', name: '概率论与数理统计', semester: '2023秋', semesterIndex: 3,
      score: 55, credit: 3, category: 'general', teacher: '李教授',
      classAvg: 66, classFailRate: 20, classTotal: 80, classFailCount: 16,
      required: true, riskLevel: 'mixed',
      analysis: '挂科率 20%，该生 55 分距及格差 5 分；数学基础持续偏弱，建议系统性补强数理能力。',
    },

    // ── 2024春 大二下 ──
    {
      id: 'f07', name: '操作系统', semester: '2024春', semesterIndex: 4,
      score: 42, credit: 4, category: 'major-core', teacher: '吴教授',
      classAvg: 60, classFailRate: 32, classTotal: 78, classFailCount: 25,
      required: true, riskLevel: 'course',
      analysis: '挂科率 32%，课程为专业硬核课；该生 42 分属基础薄弱叠加课程偏难，需重点安排补修计划。',
    },
  ],
}

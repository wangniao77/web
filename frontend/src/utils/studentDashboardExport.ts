import type { StudentDashboardVM } from '@/types/student/view'
import type { ExcelSheet } from '@/utils/exportExcel'

/** 将驾驶舱 VM 拆成多个工作表，供总览页导出。 */
export function dashboardToExcelSheets(d: StudentDashboardVM): ExcelSheet[] {
  return [
    {
      name: '基本信息',
      headers: ['字段', '值'],
      rows: [
        ['姓名', d.profile.name],
        ['学号', d.profile.studentId],
        ['性别', d.profile.gender],
        ['学院', d.profile.college],
        ['专业', d.profile.major],
        ['班级', d.profile.className],
        ['年级', d.profile.grade],
        ['辅导员', d.profile.counselor],
        ['宿舍', d.profile.dormitory],
        ['政治面貌', d.profile.politicalStatus],
        ['高潜标签', (d.profile.highPotentialTags || []).join('、')],
      ],
    },
    {
      name: '学业指标',
      headers: ['指标', '值'],
      rows: [
        ['GPA', d.academic.gpa],
        ['班排', `${d.academic.classRank}/${d.academic.classTotal}`],
        ['专排', `${d.academic.majorRank}/${d.academic.majorTotal}`],
        ['院排', `${d.academic.departmentRank}/${d.academic.departmentTotal}`],
        ['已修学分', d.creditProgress.earned],
        ['应修学分', d.creditProgress.required],
        ['综合指数', d.growthOverview.growthIndex],
        ['素养得分', d.growthOverview.qualityScore],
      ],
    },
    {
      name: '奖学金',
      headers: ['学年', '奖学金名称'],
      rows: (d.scholarships || []).map((s) => [s.year, s.name]),
    },
    {
      name: '预警关注',
      headers: ['类别', '等级', '说明'],
      rows: (d.attention || []).map((a) => [a.category, a.levelLabel || a.level, a.label]),
    },
    {
      name: '竞赛获奖',
      headers: ['名称', '明细'],
      rows: (d.competition?.highlights || []).map((h) => [h.label, h.detail || '']),
    },
  ]
}

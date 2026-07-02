export interface StudentProfileDTO {
  name: string
  studentId: string
  college: string
  major: string
  grade: string
  growthIndex: number
  gpa: number
  credits: { earned: number; required: number }
  warnings: Array<{ type: string; label: string; level: 'low' | 'medium' | 'high' }>
  achievements: Array<{ label: string; value: string }>
}

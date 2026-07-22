/** 学籍成绩一行（Excel / DB 对齐字段，camel + snake 兼容在加载时归一）。 */
export interface StudentAcademicRow {
  grade: number | null
  student_id: string
  name: string
  gender?: string | null
  teaching_department?: string | null
  major_name?: string | null
  class_name?: string | null
  campus?: string | null
  political_status?: string | null
  phone?: string | null
  native_place?: string | null
  building?: string | null
  dormitory_name?: string | null
  class_teacher?: string | null
  counselor?: string | null
  supervisor_name?: string | null
  status?: string | null
  student_picture_path?: string | null
  /** 姓名照片对应表.csv「照片文件名」，如 22251102220_刘华杰.jpeg */
  photo_filename?: string | null
  major_course_avg_score?: number | null
  subject_basic_course_avg_score?: number | null
  general_course_avg_score?: number | null
  required_course_avg_score?: number | null
  elective_course_avg_score?: number | null
  all_course_count?: number | null
  absent_exam_count?: number | null
  makeup_exam_count?: number | null
  retake_count?: number | null
  earned_total_credits?: number | null
  failed_total_credits?: number | null
  major_total_credits?: number | null
  average_credit_gpa?: number | null
  cet4_score?: number | null
  cet6_score?: number | null
  competition_award_count?: number | null
  competition_award_detail?: string | null
  pe_standard?: string | null
}

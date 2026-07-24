/** 一级页点击后二级默认定位 */
export type EnrollmentEmploymentFocus =
  | 'overview'
  | 'admission-scale'
  | 'source-quality'
  | 'exit-quality'
  | 'high-quality-dest'
  | 'admission-trend'
  | 'employment-trend'
  | 'entrance-flow'
  | 'outcome-flow'

export interface EnrollmentEmploymentOverviewDTO {
  enrolledCount: number
  sourceQualityIndex: number
  placementRate: number
  highQualityEmploymentRate: number
  entranceTrend: {
    conclusion: string
    years: string[]
    values: number[]
  }
  exitTrend: {
    conclusion: string
    years: string[]
    values: number[]
  }
  /** 一级页桑基预览：专业 → 去向 */
  flowPreview: {
    title: string
    nodes: Array<{ name: string }>
    links: Array<{ source: string; target: string; value: number }>
  }
  mockFields?: string[]
}

export interface EnrollmentEmploymentInsightItem {
  title: string
  detail: string
  tone?: 'info' | 'good' | 'warn'
}

export interface EnrollmentEmploymentDrillSample {
  name: string
  /** 学号 */
  studentId?: string
  major: string
  /** 班级 */
  className?: string
  /** 学历（本科/硕士等，来自就业表） */
  educationLevel?: string
  detail: string
  /** 月薪展示；升学类不下发 */
  salary?: string | null
  tag?: string
}

export interface EnrollmentEmploymentDetailDTO extends EnrollmentEmploymentOverviewDTO {
  filters: {
    years: string[]
    majors: string[]
    selectedYear?: string | null
    selectedMajor?: string
  }
  admission: {
    scale: {
      enrolledCount: number
      firstChoiceRate: number
    }
    quality: {
      sourceQualityIndex: number
      avgScore: number
      minScore: number
      avgRank: number
      prevAvgScore: number
      prevMinScore: number
      prevAvgRank: number
    }
    majorShare: Array<{ major: string; count: number; ratio: number }>
    sourceStructure: {
      provinces: Array<{ name: string; count: number; ratio: number }>
      inOutProvince: { inProvince: number; outProvince: number }
      gender: { male: number; female: number }
    }
    yearlyTrend: {
      years: string[]
      enrolled: number[]
      qualityIndex: number[]
      firstChoiceRate: number[]
    }
    insights: EnrollmentEmploymentInsightItem[]
    actions: string[]
    drillSamples: Record<string, EnrollmentEmploymentDrillSample[]>
  }
  graduation: {
    exitQuality: {
      placementRate: number
      highQualityEmploymentRate: number
    }
    highQualityDest: Array<{
      key:
        | 'key-employer'
        | 'gov-institution'
        | 'domestic-grad'
        | 'abroad-grad'
        | 'grassroots'
        | 'startup'
      label: string
      count: number
      ratio: number
    }>
    gradSchools: Array<{ name: string; count: number; ratio: number }>
    distribution: {
      industry: Array<{ name: string; count: number; ratio: number }>
      region: Array<{ name: string; count: number; ratio: number }>
      salary: Array<{ name: string; count: number; ratio: number }>
    }
    /** 就业行业词云（真实 industry） */
    industryCloud?: Array<{ name: string; weight: number }>
    /** 岗位词云（真实 job_title；替代无源的技能词云） */
    jobCloud?: Array<{ name: string; weight: number }>
    majorCompare: Array<{
      major: string
      /** 该专业本届人数 */
      count?: number
      placementRate: number
      highQualityRate: number
    }>
    yearlyTrend: {
      years: string[]
      placementRate: number[]
      highQualityRate: number[]
      /** 各届入统人数，供趋势图 tooltip */
      cohortCounts?: number[]
    }
    cohort?: {
      year?: string | null
      count: number
      outcomes?: Array<{ key: string; label: string; count: number; ratio: number }>
    }
    insights: EnrollmentEmploymentInsightItem[]
    actions: string[]
    drillSamples: Record<string, EnrollmentEmploymentDrillSample[]>
  }
}

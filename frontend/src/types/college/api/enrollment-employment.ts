/** 一级页点击后二级默认定位 */
export type EnrollmentEmploymentFocus =
  | 'overview'
  | 'admission-scale'
  | 'source-quality'
  | 'exit-quality'
  | 'high-quality-dest'
  | 'admission-trend'
  | 'employment-trend'

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
}

export interface EnrollmentEmploymentDetailDTO extends EnrollmentEmploymentOverviewDTO {
  filters: {
    years: string[]
    majors: string[]
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
  }
  graduation: {
    exitQuality: {
      placementRate: number
      highQualityEmploymentRate: number
    }
    highQualityDest: Array<{
      key: 'big-tech' | 'domestic-grad' | 'abroad' | 'civil-service'
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
    majorCompare: Array<{
      major: string
      placementRate: number
      highQualityRate: number
    }>
    yearlyTrend: {
      years: string[]
      placementRate: number[]
      highQualityRate: number[]
    }
  }
}

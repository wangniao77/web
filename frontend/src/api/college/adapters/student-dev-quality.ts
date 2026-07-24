import type {
  StudentDevDetailDTO,
  StudentDevQualityDTO,
  StudentEvaluationDetailDTO,
  StudentFlowSankeyDTO,
} from '@/types/college/api/student-dev-quality'
import type {
  StudentDevDetailVM,
  StudentDevQualityVM,
  StudentEvaluationDetailVM,
  StudentFlowSankeyVM,
} from '@/types/college/view/student-dev-quality'

export function adaptStudentDevQuality(dto: StudentDevQualityDTO): StudentDevQualityVM {
  return {
    dimension: dto.dimension,
    enrolledUndergrad: dto.enrolledUndergrad,
    enrolledGraduate: dto.enrolledGraduate,
    employmentRate: dto.employmentRate,
    employmentRateByYear: {
      years: [...dto.employmentRateByYear.years],
      rates: [...dto.employmentRateByYear.rates],
    },
    outcomesPreview: dto.outcomesPreview.map((o) => ({ ...o })),
    growthValue: { ...dto.growthValue, trend: { ...dto.growthValue.trend } },
    undergradGpaByGrade: dto.undergradGpaByGrade.map((grade) => ({
      ...grade,
      majors: grade.majors.map((m) => ({ ...m })),
    })),
    developmentIndex: dto.developmentIndex,
    highPotential: {
      ...dto.highPotential,
      structure: dto.highPotential.structure.map((s) => ({ ...s })),
      byDimension: dto.highPotential.byDimension.map((i) => ({ ...i })),
      courseDistribution: dto.highPotential.courseDistribution.map((i) => ({ ...i })),
      trend: {
        months: [...dto.highPotential.trend.months],
        counts: [...dto.highPotential.trend.counts],
        developmentIndices: [...dto.highPotential.trend.developmentIndices],
      },
      ratioTrend: { ...dto.highPotential.ratioTrend },
    },
    groups: { ...dto.groups },
    warningBreakdown: dto.warningBreakdown.map((w) => ({ ...w })),
    evaluationIndicators: dto.evaluationIndicators.map((item) => ({ ...item })),
    mockFields: dto.mockFields ? [...dto.mockFields] : [],
  }
}

export function adaptStudentFlowSankey(dto: StudentFlowSankeyDTO): StudentFlowSankeyVM {
  const drills = dto.outcomeDrillSamples || {}
  return {
    entrance: {
      nodes: dto.entrance.nodes.map((n) => ({ ...n })),
      links: dto.entrance.links.map((l) => ({ ...l })),
    },
    outcome: {
      nodes: dto.outcome.nodes.map((n) => ({ ...n })),
      links: dto.outcome.links.map((l) => ({ ...l })),
    },
    outcomeDrillSamples: Object.fromEntries(
      Object.entries(drills).map(([k, rows]) => [k, rows.map((r) => ({ ...r }))]),
    ),
    summary: { ...dto.summary },
    mockFields: dto.mockFields ? [...dto.mockFields] : [],
  }
}

export function adaptStudentEvaluationDetail(dto: StudentEvaluationDetailDTO): StudentEvaluationDetailVM {
  return {
    key: dto.key,
    label: dto.label,
    score: dto.score,
    unit: dto.unit,
    description: dto.description,
    trend: { ...dto.trend },
    highlights: dto.highlights.map((h) => ({ ...h })),
  }
}

export function adaptStudentDevDetail(dto: StudentDevDetailDTO): StudentDevDetailVM {
  return {
    summary: { ...dto.summary },
    outcomes: dto.outcomes.map((o) => ({ ...o })),
    salaryByMajor: {
      years: [...dto.salaryByMajor.years],
      series: dto.salaryByMajor.series.map((s) => ({ name: s.name, data: [...s.data] })),
    },
    gaokaoScores: dto.gaokaoScores.map((g) => ({ ...g })),
    highPotentialBreakdown: {
      byMajor: dto.highPotentialBreakdown.byMajor.map((i) => ({ ...i })),
      byGrade: dto.highPotentialBreakdown.byGrade.map((i) => ({ ...i })),
      byType: dto.highPotentialBreakdown.byType.map((i) => ({ ...i })),
    },
    warningBreakdown: {
      byType: dto.warningBreakdown.byType.map((i) => ({ ...i })),
      byMajor: dto.warningBreakdown.byMajor.map((i) => ({ ...i })),
      byGrade: dto.warningBreakdown.byGrade.map((i) => ({ ...i })),
    },
    undergradDistribution: {
      byMajor: dto.undergradDistribution.byMajor.map((i) => ({ ...i })),
      byGrade: dto.undergradDistribution.byGrade.map((i) => ({ ...i })),
    },
    mockFields: dto.mockFields ? [...dto.mockFields] : [],
  }
}

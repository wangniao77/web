import type {
  ModuleKpiDTO,
  ModuleSectionDTO,
  ModuleTableRowDTO,
  OrbitKpiDTO,
} from '@/types/university/api/modules'

export type {
  BenchmarkModuleDTO,
  DisciplineTalentModuleDTO,
  EmploymentRiskModuleDTO,
  GoalsModuleDTO,
  ModuleChartLineDTO,
  ModuleKpiDTO,
  ModuleSectionDTO,
  ModuleTableRowDTO,
  OrbitKpiDTO,
  PostureModuleDTO,
  ResearchModuleDTO,
  UniversityModulesDTO,
} from '@/types/university/api/modules'

export interface OrbitKpiVM extends OrbitKpiDTO {
  valueLabel: string
}

export interface PostureModuleVM {
  developmentIndex: number
  developmentIndexLabel: string
  yoyChange: number
  yoyChangeLabel: string
  orbitKpis: OrbitKpiVM[]
  sections: Record<string, ModuleSectionDTO>
}

export interface GoalsModuleVM {
  completionRate: number
  completionRateLabel: string
  statusCounts: { completed: number; ongoing: number; lagging: number }
  tasks: ModuleTableRowDTO[]
  trend: Array<{ year: string; rate: number }>
  sections: Record<string, ModuleSectionDTO>
}

export interface BenchmarkModuleVM {
  nationalRank: number
  provincialRank: number
  benchmarkCount: number
  rankChange: number
  financeRank: number
  rankTrend: Array<{ year: string; rank: number }>
  dimensionGrowth: Array<{ label: string; change: number; changeLabel: string }>
  radar: { indicators: string[]; self: number[]; benchmark: number[] }
  sections: Record<string, ModuleSectionDTO>
}

export interface DisciplineTalentModuleVM {
  phdPoints: number
  masterPoints: number
  firstClassMajors: number
  satisfaction: number
  satisfactionLabel: string
  qualityCompare: { categories: string[]; school: number[]; national: number[] }
  sections: Record<string, ModuleSectionDTO>
}

export interface ResearchModuleVM {
  funding: number
  horizontalFunding: number
  patents: number
  awards: number
  contractValue: number
  fundingTrend: Array<{ year: string; value: number }>
  fundingStructure: Array<{ name: string; value: number }>
  sections: Record<string, ModuleSectionDTO>
}

export interface EmploymentRiskModuleVM {
  placementRate: number
  furtherStudyRate: number
  highQualityRate: number
  destination: Array<{ name: string; value: number }>
  unitTypes: Array<{ name: string; value: number }>
  studyLevels: Array<{ name: string; value: number }>
  risks: ModuleKpiDTO[]
  sections: Record<string, ModuleSectionDTO>
}

export interface UniversityModulesVM {
  posture: PostureModuleVM
  goals: GoalsModuleVM
  benchmark: BenchmarkModuleVM
  disciplineTalent: DisciplineTalentModuleVM
  research: ResearchModuleVM
  employmentRisk: EmploymentRiskModuleVM
}

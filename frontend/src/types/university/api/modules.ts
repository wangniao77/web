export interface ModuleKpiDTO {
  label: string
  value: string | number
  unit?: string
  trend?: string
}

export interface ModuleChartLineDTO {
  type: 'line' | 'bar' | 'groupedBar' | 'donut' | 'radar' | 'hbar'
  categories?: string[]
  values?: number[]
  series?: Array<{ name: string; data: number[] }>
  data?: Array<{ name: string; value: number }>
  indicators?: string[]
  radarSeries?: Array<{ name: string; value: number[] }>
}

export interface ModuleTableRowDTO {
  name: string
  dept?: string
  progress?: number
  status?: string
  extra?: string
}

export interface ModuleSectionDTO {
  title: string
  summary?: string
  kpis?: ModuleKpiDTO[]
  chart?: ModuleChartLineDTO
  table?: ModuleTableRowDTO[]
  items?: Array<{ label: string; value: string }>
}

export interface OrbitKpiDTO {
  key: string
  label: string
  value: number
  unit?: string
  position: 'tl' | 'tr' | 'ml' | 'mr' | 'bl' | 'br' | 'll' | 'rr'
}

export interface PostureModuleDTO {
  developmentIndex: number
  yoyChange: number
  orbitKpis: OrbitKpiDTO[]
  sections: Record<string, ModuleSectionDTO>
}

export interface GoalStatusCountDTO {
  completed: number
  ongoing: number
  lagging: number
}

export interface GoalsModuleDTO {
  completionRate: number
  statusCounts: GoalStatusCountDTO
  tasks: ModuleTableRowDTO[]
  trend: Array<{ year: string; rate: number }>
  sections: Record<string, ModuleSectionDTO>
}

export interface BenchmarkModuleDTO {
  nationalRank: number
  provincialRank: number
  benchmarkCount: number
  rankChange: number
  financeRank: number
  rankTrend: Array<{ year: string; rank: number }>
  dimensionGrowth: Array<{ label: string; change: number }>
  radar: { indicators: string[]; self: number[]; benchmark: number[] }
  sections: Record<string, ModuleSectionDTO>
}

export interface DisciplineTalentModuleDTO {
  phdPoints: number
  masterPoints: number
  firstClassMajors: number
  satisfaction: number
  qualityCompare: { categories: string[]; school: number[]; national: number[] }
  sections: Record<string, ModuleSectionDTO>
}

export interface ResearchModuleDTO {
  funding: number
  horizontalFunding: number
  patents: number
  awards: number
  contractValue: number
  fundingTrend: Array<{ year: string; value: number }>
  fundingStructure: Array<{ name: string; value: number }>
  sections: Record<string, ModuleSectionDTO>
}

export interface EmploymentRiskModuleDTO {
  placementRate: number
  furtherStudyRate: number
  highQualityRate: number
  destination: Array<{ name: string; value: number }>
  unitTypes: Array<{ name: string; value: number }>
  studyLevels: Array<{ name: string; value: number }>
  risks: ModuleKpiDTO[]
  sections: Record<string, ModuleSectionDTO>
}

export interface UniversityModulesDTO {
  posture: PostureModuleDTO
  goals: GoalsModuleDTO
  benchmark: BenchmarkModuleDTO
  disciplineTalent: DisciplineTalentModuleDTO
  research: ResearchModuleDTO
  employmentRisk: EmploymentRiskModuleDTO
}

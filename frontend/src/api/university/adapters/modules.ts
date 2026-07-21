import type { UniversityModulesDTO } from '@/types/university/api/modules'
import type { UniversityModulesVM } from '@/types/university/view/modules'
import { mockUniversityModules } from '@/mock/university/modules'

function formatChange(v: number) {
  return v >= 0 ? `+${v}%` : `${v}%`
}

export function adaptUniversityModules(dto?: UniversityModulesDTO): UniversityModulesVM {
  const data = dto ?? mockUniversityModules
  return {
    posture: {
      ...data.posture,
      developmentIndexLabel: data.posture.developmentIndex.toFixed(1),
      yoyChangeLabel: formatChange(data.posture.yoyChange),
      orbitKpis: data.posture.orbitKpis.map((k) => ({
        ...k,
        valueLabel: String(k.value),
      })),
      sections: data.posture.sections,
    },
    goals: {
      ...data.goals,
      completionRateLabel: `${data.goals.completionRate}%`,
      sections: data.goals.sections,
    },
    benchmark: {
      ...data.benchmark,
      dimensionGrowth: data.benchmark.dimensionGrowth.map((d) => ({
        ...d,
        changeLabel: formatChange(d.change),
      })),
      sections: data.benchmark.sections,
    },
    disciplineTalent: {
      ...data.disciplineTalent,
      satisfactionLabel: `${data.disciplineTalent.satisfaction}%`,
      sections: data.disciplineTalent.sections,
    },
    research: {
      ...data.research,
      sections: data.research.sections,
    },
    employmentRisk: {
      ...data.employmentRisk,
      sections: data.employmentRisk.sections,
    },
  }
}

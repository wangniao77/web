<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { DisciplineOverviewDetailVM } from '@/types/college/view/discipline-overview'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: DisciplineOverviewDetailVM
}>()

const activeMajor = ref(props.data.majorProfiles[0]?.name ?? props.data.majors[0]?.name ?? '')

watch(
  () => props.data.majorProfiles,
  (profiles) => {
    if (!profiles.some((p) => p.name === activeMajor.value)) {
      activeMajor.value = profiles[0]?.name ?? ''
    }
  },
  { immediate: true },
)

const profile = computed(() =>
  props.data.majorProfiles.find((p) => p.name === activeMajor.value) ?? null,
)

function formatChange(change: number) {
  if (change > 0) return `↑${change}`
  if (change < 0) return `↓${Math.abs(change)}`
  return '→'
}

const nationalTrendOption = computed<EChartsOption>(() => {
  const trends = props.data.rankTrends
  const years = Array.from(new Set(trends.flatMap((t) => t.years))).sort()
  const colors = ['#39e6ff', '#ffd56a', '#63ffe1']

  return {
    grid: { left: 8, right: 12, top: 28, bottom: 4, containLabel: true },
    legend: {
      top: 0,
      textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend },
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
    },
    yAxis: {
      type: 'value',
      inverse: true,
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8', formatter: '第{value}' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: trends.map((item, index) => ({
      name: item.major.replace('科学与技术', ''),
      type: 'line' as const,
      smooth: true,
      data: years.map((year) => {
        const i = item.years.indexOf(year)
        return i >= 0 ? item.nationalRanks[i] : null
      }),
      lineStyle: { width: 2, color: colors[index % colors.length] },
      itemStyle: { color: colors[index % colors.length] },
    })),
  }
})
</script>

<template>
  <div class="discipline-detail">
    <div class="discipline-detail__section">
      <h3>三个本科专业总览</h3>
      <div class="discipline-detail__table-wrap">
        <table class="discipline-detail__table">
          <thead>
            <tr>
              <th>专业</th>
              <th>等级</th>
              <th>全国排名</th>
              <th>较上年</th>
              <th>省内</th>
              <th>财经类</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data.majorRankings" :key="item.major">
              <td>{{ item.major }}</td>
              <td><em class="discipline-detail__grade">{{ item.grade }}</em></td>
              <td>第{{ item.currentRank }}名</td>
              <td>{{ formatChange(item.yoyChange) }}</td>
              <td>第{{ item.provincialRank }}名</td>
              <td>第{{ item.financePeerRank }}名</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="data.majorProfiles.length" class="discipline-detail__section">
      <h3>单专业全景</h3>
      <div class="discipline-detail__tabs">
        <button
          v-for="item in data.majorProfiles"
          :key="item.name"
          type="button"
          class="discipline-detail__tab"
          :class="{ 'is-active': activeMajor === item.name }"
          @click="activeMajor = item.name"
        >
          {{ item.name }}
        </button>
      </div>

      <template v-if="profile">
        <div class="discipline-detail__profile-head">
          <div>
            <strong>{{ profile.name }}</strong>
            <em>{{ profile.grade }}级</em>
          </div>
          <p>{{ profile.orientation }}</p>
        </div>

        <div class="discipline-detail__grid">
          <article>
            <h4>基础概况</h4>
            <ul>
              <li><span>办学年限</span><strong>{{ profile.foundedYears }} 年</strong></li>
              <li><span>认证 / 评级</span><strong>{{ profile.accreditation }}</strong></li>
              <li><span>建设类型</span><strong>{{ profile.constructionType }}</strong></li>
              <li><span>官方 / 软科排名</span><strong>第{{ profile.officialRank }} / 第{{ profile.softRank }}</strong></li>
              <li><span>年度招生</span><strong>{{ profile.enrollmentPlan }} 人</strong></li>
              <li><span>在校生</span><strong>{{ profile.studentCount }} 人</strong></li>
              <li><span>学制</span><strong>{{ profile.educationYears }} 年</strong></li>
              <li>
                <span>年级分布</span>
                <strong>{{ profile.gradeDistribution.map((g) => `${g.grade}${g.count}`).join(' · ') }}</strong>
              </li>
              <li><span>核心方向</span><strong>{{ profile.directions.join(' · ') }}</strong></li>
            </ul>
          </article>

          <article>
            <h4>师资概况</h4>
            <ul>
              <li><span>专任教师</span><strong>{{ profile.faculty.total }} 人</strong></li>
              <li>
                <span>职称结构</span>
                <strong>
                  正高 {{ profile.faculty.professor }} /
                  副高 {{ profile.faculty.associate }} /
                  讲师 {{ profile.faculty.lecturer }}
                </strong>
              </li>
              <li>
                <span>博士学历</span>
                <strong>{{ profile.faculty.phdCount }} 人（{{ profile.faculty.phdRatio }}%）</strong>
              </li>
              <li><span>省级及以上人才</span><strong>{{ profile.faculty.talentCount }} 人</strong></li>
              <li><span>教学名师</span><strong>{{ profile.faculty.teachingMasters }} 人</strong></li>
              <li><span>课程负责人</span><strong>{{ profile.faculty.courseLeaders }}</strong></li>
              <li><span>教研团队</span><strong>{{ profile.faculty.researchTeams }}</strong></li>
            </ul>
          </article>

          <article>
            <h4>近五年核心成果</h4>
            <ul>
              <li><span>高水平论文</span><strong>{{ profile.outcomes.papers }} 篇</strong></li>
              <li><span>省部级及以上纵向</span><strong>{{ profile.outcomes.verticalProjects }} 项</strong></li>
              <li><span>校级 / 横向</span><strong>{{ profile.outcomes.horizontalProjects }} 项</strong></li>
              <li>
                <span>专利 / 软著</span>
                <strong>{{ profile.outcomes.patents }} / {{ profile.outcomes.softwares }}</strong>
              </li>
              <li>
                <span>一流课程等</span>
                <strong>{{ profile.outcomes.eliteCourses }} 门</strong>
              </li>
              <li>
                <span>教改 / 成果奖</span>
                <strong>{{ profile.outcomes.reformProjects }} / {{ profile.outcomes.teachingAwards }}</strong>
              </li>
              <li>
                <span>平台 / 实训基地</span>
                <strong>{{ profile.outcomes.platforms }} / {{ profile.outcomes.practiceBases }}</strong>
              </li>
              <li>
                <span>代表成果</span>
                <strong>{{ profile.outcomes.representativePapers[0] || profile.outcomes.keyProjects[0] }}</strong>
              </li>
            </ul>
          </article>

          <article>
            <h4>生源质量</h4>
            <ul>
              <li><span>录取均分 / 最低分</span><strong>{{ profile.enrollment.avgScore }} / {{ profile.enrollment.minScore }}</strong></li>
              <li><span>平均录取位次</span><strong>{{ profile.enrollment.avgRank }}</strong></li>
              <li><span>第一志愿率</span><strong>{{ profile.enrollment.firstChoiceRate }}%</strong></li>
              <li><span>省内生源占比</span><strong>{{ profile.enrollment.provinceInRatio }}%</strong></li>
              <li><span>男生比例</span><strong>{{ profile.enrollment.maleRatio }}%</strong></li>
              <li><span>学业基础</span><strong>{{ profile.enrollment.freshmanBasis }}</strong></li>
            </ul>
          </article>

          <article>
            <h4>人才培养成果</h4>
            <ul>
              <li>
                <span>毕业率 / 学位率</span>
                <strong>{{ profile.cultivation.graduationRate }}% / {{ profile.cultivation.degreeRate }}%</strong>
              </li>
              <li><span>平均绩点</span><strong>{{ profile.cultivation.avgGpa }}</strong></li>
              <li><span>学科竞赛获奖</span><strong>{{ profile.cultivation.competitionAwards }} 项</strong></li>
              <li><span>大创 / 科创立项</span><strong>{{ profile.cultivation.innovationProjects }} 项</strong></li>
              <li><span>去向落实率</span><strong>{{ profile.cultivation.employmentRate }}%</strong></li>
              <li>
                <span>升学 / 优质就业</span>
                <strong>{{ profile.cultivation.furtherStudyRate }}% / {{ profile.cultivation.qualityJobRatio }}%</strong>
              </li>
              <li><span>主要行业</span><strong>{{ profile.cultivation.topIndustries.join(' · ') }}</strong></li>
              <li><span>主要地区</span><strong>{{ profile.cultivation.topRegions.join(' · ') }}</strong></li>
            </ul>
          </article>

          <article>
            <h4>综合研判</h4>
            <p class="discipline-detail__note">{{ profile.judgment.trendSummary }}</p>
            <ul>
              <li>
                <span>核心优势</span>
                <strong>{{ profile.judgment.strengths.join('；') }}</strong>
              </li>
              <li>
                <span>短板</span>
                <strong>{{ profile.judgment.weaknesses.join('；') }}</strong>
              </li>
              <li>
                <span>年度建设重点</span>
                <strong>{{ profile.judgment.priorities.join('；') }}</strong>
              </li>
              <li>
                <span>数据备注</span>
                <strong>{{ profile.judgment.dataNote }}</strong>
              </li>
            </ul>
          </article>
        </div>
      </template>
    </div>

    <div class="discipline-detail__section">
      <h3>专业等级历年变化</h3>
      <div class="discipline-detail__grade-history">
        <div
          v-for="item in data.gradeHistory"
          :key="item.major"
          class="discipline-detail__grade-card"
        >
          <h4>{{ item.major }}</h4>
          <div class="discipline-detail__grade-track">
            <div
              v-for="(grade, idx) in item.grades"
              :key="`${item.major}-${item.years[idx]}`"
              class="discipline-detail__grade-node"
            >
              <strong>{{ grade }}</strong>
              <span>{{ item.years[idx] }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="discipline-detail__section">
      <h3>全国排名近年趋势</h3>
      <div class="discipline-detail__chart">
        <ChartContainer :option="nationalTrendOption" />
      </div>
    </div>

    <div class="discipline-detail__section">
      <h3>横向对标评估</h3>
      <p class="discipline-detail__hint">{{ data.benchmarkNote }}</p>
      <div class="discipline-detail__table-wrap">
        <table class="discipline-detail__table">
          <thead>
            <tr>
              <th>对标院校</th>
              <th>公开资质</th>
              <th>一流建设</th>
              <th>生源 / 就业（公开）</th>
              <th>定性差异</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data.peerBenchmarks" :key="item.school">
              <td>{{ item.school }}</td>
              <td>{{ item.majorType }}</td>
              <td>{{ item.eliteProgram }}</td>
              <td>{{ item.sourceScore }}；{{ item.employmentNote }}</td>
              <td>{{ item.gapNote }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="discipline-detail__columns">
      <div class="discipline-detail__section">
        <h3>省内位置对比</h3>
        <p class="discipline-detail__hint">广外、广大、广财、广技师完整对比</p>
        <ul class="discipline-detail__list">
          <li
            v-for="item in data.provincialComparison"
            :key="item.school"
            :class="{ 'is-self': item.isSelf }"
          >
            <span>{{ item.school }}</span>
            <strong>第{{ item.rank }}名</strong>
          </li>
        </ul>
      </div>
      <div class="discipline-detail__section">
        <h3>财经类位置对比</h3>
        <p class="discipline-detail__hint">广财前面的 5 所高校</p>
        <ul class="discipline-detail__list">
          <li v-for="item in data.financeAheadSchools" :key="item.school">
            <span>{{ item.school }}</span>
            <strong>第{{ item.rank }}名</strong>
          </li>
        </ul>
      </div>
    </div>

    <div class="discipline-detail__columns">
      <div class="discipline-detail__section">
        <h3>优势研判</h3>
        <ul class="discipline-detail__bullets">
          <li v-for="item in data.strengths" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div class="discipline-detail__section">
        <h3>提升建议</h3>
        <ul class="discipline-detail__bullets">
          <li v-for="item in data.suggestions" :key="item">{{ item }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.discipline-detail__section {
  margin-top: 16px;

  h3 {
    margin: 0 0 10px;
    color: #d8f0ff;
    font-size: 24px;
    font-weight: 700;
  }

  h4 {
    margin: 0 0 8px;
    color: #9fe8ff;
    font-size: 22px;
    font-weight: 700;
  }
}

.discipline-detail__hint {
  margin: -4px 0 8px;
  color: rgba(158, 202, 232, 0.75);
  font-size: 22px;
  line-height: 1.5;
}

.discipline-detail__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.discipline-detail__tab {
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.22);
  background: rgba(0, 40, 90, 0.3);
  color: #9ecae8;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;

  &.is-active {
    color: #eaf7ff;
    border-color: rgba(0, 242, 255, 0.5);
    background: rgba(0, 110, 200, 0.38);
  }
}

.discipline-detail__profile-head {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 50, 100, 0.22);

  div {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;

    strong {
      color: #eaf7ff;
      font-size: 24px;
    }

    em {
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid rgba(255, 213, 106, 0.4);
      background: rgba(255, 213, 106, 0.12);
      color: #ffd56a;
      font-style: normal;
      font-weight: 800;
    }
  }

  p {
    margin: 0;
    color: #9ecae8;
    font-size: 20px;
    line-height: 1.5;
  }
}

.discipline-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  article {
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid rgba(0, 200, 255, 0.14);
    background: rgba(0, 40, 90, 0.24);

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 8px;
    }

    li {
      display: grid;
      grid-template-columns: 120px minmax(0, 1fr);
      gap: 10px;
      align-items: start;

      span {
        color: #8ec8e8;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.45;
      }

      strong {
        color: #eaf7ff;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.45;
        word-break: break-word;
      }
    }
  }
}

.discipline-detail__note {
  margin: 0 0 8px;
  color: #b8dff5;
  font-size: 18px;
  line-height: 1.5;
}

.discipline-detail__table-wrap {
  overflow: auto;
}

.discipline-detail__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 20px;

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(0, 200, 255, 0.12);
    text-align: left;
    color: #d8efff;
    vertical-align: top;
    line-height: 1.45;
  }

  th {
    color: #9ecae8;
    font-weight: 600;
  }
}

.discipline-detail__grade {
  color: #ffd56a;
  font-style: normal;
  font-weight: 800;
}

.discipline-detail__grade-history {
  display: grid;
  gap: 10px;
}

.discipline-detail__grade-card {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 50, 100, 0.2);
}

.discipline-detail__grade-track {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.discipline-detail__grade-node {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 56px;

  strong {
    color: #7ff6ff;
    font-size: 22px;
  }

  span {
    color: #9ecae8;
    font-size: 18px;
  }
}

.discipline-detail__chart {
  height: 220px;
}

.discipline-detail__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.discipline-detail__list {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 200, 255, 0.1);
    color: #d8efff;

    &.is-self {
      color: #ffd56a;
      font-weight: 700;
    }

    strong {
      color: #7fe9ff;
    }
  }
}

.discipline-detail__bullets {
  margin: 0;
  padding-left: 18px;
  color: #c6e6ff;
  line-height: 1.7;
}
</style>

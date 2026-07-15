<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import gsap from 'gsap'
import DashIcon from '@/components/college/DashIcon.vue'
import StudentTplCard from './StudentTplCard.vue'
import type {
  AcademicDevVM,
  AiPortraitVM,
  CareerDevVM,
  CompetitionVM,
  CreditProgressVM,
  EmploymentVM,
  FailedCourseVM,
  GrowthOverviewVM,
  InternshipVM,
  PersonalInfoVM,
  QualityVM,
} from '@/types/student/view'

const props = defineProps<{
  academic: AcademicDevVM
  credit: CreditProgressVM
  failedCritical: FailedCourseVM[]
  growthOverview: GrowthOverviewVM
  competition: CompetitionVM
  quality: QualityVM
  scholarships: Array<{ name: string; year: string }>
  careerDev: CareerDevVM
  internship: InternshipVM
  employment: EmploymentVM
  aiPortrait: AiPortraitVM
  profile: PersonalInfoVM
}>()

const emit = defineEmits<{ open: [id: string] }>()
const carouselRef = ref<HTMLElement | null>(null)
const currentPage = ref(0)
const AUTOPLAY_INTERVAL = 6500
let autoplayTimer: ReturnType<typeof setInterval> | null = null

/** 第二课堂分项尚未接入业务库 —— 不展示伪造学分 */
const secondClassCredits = [
  { label: '思想引领', value: '—' },
  { label: '创新创业', value: '—' },
  { label: '实践实习', value: '—' },
  { label: '文体艺术', value: '—' },
  { label: '志愿公益', value: '—' },
  { label: '技能培训', value: '—' },
  { label: '菁英成长', value: '—' },
]

const graduationRisk = computed(() => {
  const failedCount = props.failedCritical.filter((course) => course.score < 60).length
  if (failedCount >= 3) return { label: '高风险', level: 'high' }
  if (failedCount > 0) return { label: '需关注', level: 'medium' }
  return { label: '正常', level: 'low' }
})

const thesisStage = computed(() => {
  const entranceYear = Number(props.profile.grade.match(/\d{4}/)?.[0] ?? 0)
  if (entranceYear >= 2024) return '未开始'
  if (props.profile.thesisStatus?.includes('选题')) return '选题'
  return props.profile.thesisStatus || '未开始'
})

const bestJobMatch = computed(() => props.aiPortrait.jobMatches[0]?.match ?? props.employment.jobReadiness)
const scholarshipCount = computed(() => props.scholarships.length)
const academicTrend = computed(() => {
  const values = props.academic.gpaValues
  const current = values[values.length - 1] ?? props.academic.gpa
  const previous = values[values.length - 2] ?? current
  const delta = current - previous
  const direction = delta >= 0 ? '提升' : '下降'
  return `GPA 较上学期${direction} ${Math.abs(delta).toFixed(2)}，当前唯一毕业影响项为必修课补考。`
})
const qualityInsight = computed(() => {
  const topPercent = (props.growthOverview.overallRank / props.growthOverview.overallTotal) * 100
  return `综合测评位于同年级前 ${topPercent.toFixed(1)}%，竞赛与科研表现构成当前主要优势。`
})
const careerInsight = computed(() => {
  const base = props.careerDev.internshipBases[0] || props.careerDev.practiceBases[0] || '校内实践基地'
  return `已进入${base}开展实践，推荐优先补强岗位所需的工程化项目经历。`
})
const graduationInsight = computed(() => {
  return `${graduationRisk.value.label === '正常' ? '毕业进度总体正常' : '毕业进度需要重点跟进'}，当前发展意向为${props.careerDev.employmentIntention || '待确认'}。`
})

function stopAutoplay() {
  if (autoplayTimer) clearInterval(autoplayTimer)
  autoplayTimer = null
}

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    currentPage.value = currentPage.value === 1 ? 0 : 1
  }, AUTOPLAY_INTERVAL)
}

function previousPage() {
  currentPage.value = currentPage.value === 0 ? 1 : 0
  startAutoplay()
}

function nextPage() {
  currentPage.value = currentPage.value === 1 ? 0 : 1
  startAutoplay()
}

function selectPage(page: number) {
  currentPage.value = page
  startAutoplay()
}

function animateVisibleCards() {
  const root = carouselRef.value
  if (!root) return
  const cards = root.querySelectorAll(`.development-slide:nth-child(${currentPage.value + 1}) .development-card`)
  gsap.fromTo(cards, { y: 20, autoAlpha: 0.55, scale: 0.98 }, {
    y: 0,
    autoAlpha: 1,
    scale: 1,
    duration: 0.48,
    stagger: 0.07,
    ease: 'power2.out',
    overwrite: true,
  })
}

watch(currentPage, async () => {
  await nextTick()
  animateVisibleCards()
})

onMounted(() => {
  startAutoplay()
  animateVisibleCards()
})
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <StudentTplCard icon="map" title="学生发展概览" class="stu-kanban-wrap">
    <div
      ref="carouselRef"
      class="development-carousel"
      @mouseenter="stopAutoplay"
      @mouseleave="startAutoplay"
      @focusin="stopAutoplay"
      @focusout="startAutoplay"
    >
      <button type="button" class="development-nav development-nav--left" aria-label="上一组" @click="previousPage">‹</button>
      <button type="button" class="development-nav development-nav--right" aria-label="下一组" @click="nextPage">›</button>

      <div class="development-viewport">
        <div class="development-track" :style="{ transform: `translateX(-${currentPage * 100}%)` }">
          <div class="development-slide" :aria-hidden="currentPage !== 0">
            <article class="development-card development-card--academic">
              <header class="development-card__head">
                <span class="development-card__icon" aria-hidden="true">
                  <DashIcon kind="academic" :size="20" />
                </span>
                <div>
                  <h4>学业概览</h4>
                </div>
                <span class="development-status development-status--low">低风险</span>
              </header>

              <div class="development-metrics">
                <div><span>当前 GPA</span><strong>{{ academic.gpa.toFixed(2) }}</strong></div>
                <div><span>学分完成率</span><strong>{{ credit.earnedPercent }}%</strong></div>
                <div><span>影响毕业课程</span><strong>{{ failedCritical.length }}<small>门</small></strong></div>
                <div><span>学业风险</span><strong class="is-safe">低风险</strong></div>
              </div>

              <section class="second-classroom">
                <div class="second-classroom__title">
                  <span>第二课堂学分完成情况</span>
                  <strong>
                    {{ credit.secondClassroomEarned > 0
                      ? `${credit.secondClassroomEarned}/${credit.secondClassroomRequired} 学分`
                      : '分项待接入' }}
                  </strong>
                </div>
                <div class="second-classroom__items">
                  <div v-for="item in secondClassCredits" :key="item.label">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </div>
                </div>
              </section>

              <div class="development-insight">
                <span>趋势解读</span>
                <p>{{ academicTrend }}</p>
              </div>

              <button type="button" class="development-card__action" @click="emit('open', 'academic')">
                查看学业详情 <span aria-hidden="true">›</span>
              </button>
            </article>

            <article class="development-card development-card--quality">
              <header class="development-card__head">
                <span class="development-card__icon" aria-hidden="true">
                  <DashIcon kind="trophy" :size="20" stroke="#e8c878" />
                </span>
                <div>
                  <h4>综合素质与荣誉</h4>
                </div>
                <span class="development-status development-status--blue">表现良好</span>
              </header>

              <div class="development-metrics development-metrics--quality">
                <div class="is-wide">
                  <span>综合测评排名</span>
                  <strong>{{ growthOverview.overallRank }} <small>/ {{ growthOverview.overallTotal }}</small></strong>
                </div>
                <div><span>奖学金</span><strong>{{ scholarshipCount }}<small>项</small></strong></div>
                <div><span>竞赛获奖</span><strong>{{ competition.awardCount }}<small>项</small></strong></div>
                <div><span>科研项目</span><strong>{{ competition.researchCount }}<small>项</small></strong></div>
              </div>

              <div class="quality-highlights">
                <span>志愿服务 {{ quality.volunteerHours }}h</span>
                <span>社会实践 {{ quality.socialPractices }} 次</span>
                <span>{{ scholarships[0]?.name || '暂无奖学金记录' }}</span>
              </div>

              <div class="development-insight">
                <span>数据解读</span>
                <p>{{ qualityInsight }}</p>
              </div>

              <button type="button" class="development-card__action" @click="emit('open', 'quality')">
                查看综合素质 <span aria-hidden="true">›</span>
              </button>
            </article>
          </div>

          <div class="development-slide" :aria-hidden="currentPage !== 1">
            <article class="development-card development-card--career">
              <header class="development-card__head">
                <span class="development-card__icon" aria-hidden="true">
                  <DashIcon kind="employment" :size="20" stroke="#43e7af" />
                </span>
                <div>
                  <h4>实习与就业</h4>
                </div>
                <span class="development-status development-status--low">发展中</span>
              </header>

              <div class="development-metrics">
                <div><span>当前状态</span><strong class="is-safe">{{ internship.internshipCount ? '实习中' : '待实习' }}</strong></div>
                <div><span>就业意向</span><strong class="is-text">{{ careerDev.employmentIntention }}</strong></div>
                <div><span>岗位匹配度</span><strong>{{ bestJobMatch }}%</strong></div>
                <div><span>推荐岗位</span><strong>{{ aiPortrait.jobMatches.length }}<small>个</small></strong></div>
              </div>

              <div class="career-matches">
                <div v-for="job in aiPortrait.jobMatches.slice(0, 3)" :key="job.role">
                  <span>{{ job.role }}</span>
                  <i><b :style="{ width: `${job.match}%` }" /></i>
                  <strong>{{ job.match }}%</strong>
                </div>
              </div>

              <div class="development-insight">
                <span>发展建议</span>
                <p>{{ careerInsight }}</p>
              </div>

              <button type="button" class="development-card__action" @click="emit('open', 'career')">
                查看发展建议 <span aria-hidden="true">›</span>
              </button>
            </article>

            <article class="development-card development-card--graduation">
              <header class="development-card__head">
                <span class="development-card__icon" aria-hidden="true">
                  <DashIcon kind="research" :size="20" stroke="#7eb8ff" />
                </span>
                <div>
                  <h4>毕业与升学</h4>
                </div>
                <span class="development-status" :class="`development-status--${graduationRisk.level}`">
                  {{ graduationRisk.label }}
                </span>
              </header>

              <div class="development-metrics">
                <div>
                  <span>毕业进度</span>
                  <strong class="graduation-progress" :class="`graduation-progress--${graduationRisk.level}`">
                    <i aria-hidden="true" />{{ graduationRisk.label }}
                  </strong>
                </div>
                <div><span>毕业论文</span><strong class="is-text">{{ thesisStage }}</strong></div>
                <div><span>指导教师</span><strong class="is-text">{{ profile.thesisAdvisor || profile.mentor }}</strong></div>
                <div><span>发展方向</span><strong class="is-text">就业</strong></div>
              </div>

              <div class="graduation-note">
                <span>当前意向</span>
                <strong>{{ careerDev.employmentIntention || '待确认' }}</strong>
              </div>

              <div class="development-insight">
                <span>进度判断</span>
                <p>{{ graduationInsight }}</p>
              </div>

              <button type="button" class="development-card__action" @click="emit('open', 'graduation')">
                查看毕业规划 <span aria-hidden="true">›</span>
              </button>
            </article>
          </div>
        </div>
      </div>

      <div class="development-pagination" aria-label="概览分页">
        <button
          v-for="page in 2"
          :key="page"
          type="button"
          :class="{ active: currentPage === page - 1 }"
          :aria-label="`第 ${page} 组`"
          @click="selectPage(page - 1)"
        />
        <span>{{ currentPage + 1 }} / 2</span>
      </div>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">
.development-carousel {
  position: relative;
  height: 100%;
  min-height: 0;
  padding: 0 46px 24px;
}

.development-viewport {
  height: 100%;
  overflow: hidden;
}

.development-track {
  display: flex;
  height: 100%;
  transition: transform 0.72s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.development-slide {
  flex: 0 0 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.development-card {
  --card-accent: #1ed6ff;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px 14px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--card-accent) 34%, transparent);
  clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--card-accent) 10%, transparent), transparent 42%),
    linear-gradient(160deg, rgba(6, 40, 78, 0.88), rgba(0, 16, 38, 0.9));
  box-shadow:
    inset 0 0 28px rgba(0, 90, 160, 0.12),
    inset 0 1px 0 rgba(180, 230, 255, 0.1);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 0 32px rgba(0, 100, 180, 0.16),
      0 10px 28px rgba(0, 0, 0, 0.28),
      0 0 18px color-mix(in srgb, var(--card-accent) 16%, transparent);
  }

  &--quality { --card-accent: #e8c878; }
  &--career { --card-accent: #43e7af; }
  &--graduation { --card-accent: #7eb8ff; }
}

.development-card__head {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(104, 200, 255, 0.12);

  h4 {
    margin: 0;
    color: #eef9ff;
    font-size: 23px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  p {
    margin: 3px 0 0;
    color: #7eb0cc;
    font-size: 14px;
  }
}

.development-card__icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--card-accent) 40%, transparent);
  border-radius: 2px;
  background: color-mix(in srgb, var(--card-accent) 12%, transparent);
  color: var(--card-accent);
  box-shadow: inset 0 0 12px color-mix(in srgb, var(--card-accent) 10%, transparent);
}

.development-status {
  padding: 4px 9px;
  border: 1px solid;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;

  &--low { border-color: rgba(74, 222, 128, 0.34); background: rgba(74, 222, 128, 0.1); color: #55e995; }
  &--medium { border-color: rgba(250, 204, 21, 0.36); background: rgba(250, 204, 21, 0.1); color: #facc15; }
  &--high { border-color: rgba(248, 91, 91, 0.42); background: rgba(248, 91, 91, 0.12); color: #ff7474; }
  &--blue { border-color: rgba(45, 206, 255, 0.34); background: rgba(45, 206, 255, 0.1); color: #65dfff; }
}

.development-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  div {
    min-width: 0;
    padding: 8px 10px;
    border: 1px solid rgba(120, 200, 255, 0.16);
    border-radius: 2px;
    background: linear-gradient(160deg, rgba(0, 50, 95, 0.45), rgba(0, 28, 58, 0.5));
    box-shadow: inset 0 1px 0 rgba(160, 220, 255, 0.06);
  }

  span {
    display: block;
    color: #8ec2de;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
  }

  strong {
    display: block;
    margin-top: 5px;
    overflow: hidden;
    color: var(--card-accent);
    font-family: var(--student-font-number);
    font-size: 30px;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;

    small {
      color: #9fc2dd;
      font-family: var(--student-font-body);
      font-size: 15px;
    }

    &.is-safe { color: #55e995; font-family: var(--student-font-body); font-size: 22px; }
    &.is-text { color: #dff4ff; font-family: var(--student-font-body); font-size: 19px; }
  }
}

.development-metrics--quality {
  grid-template-columns: 1.3fr repeat(3, 1fr);
}

.second-classroom {
  padding: 10px 12px;
  border: 1px solid rgba(0, 190, 255, 0.14);
  border-radius: 5px;
  background: rgba(0, 35, 73, 0.34);
}

.second-classroom__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;

  span { color: #b6e4ff; font-size: 16px; font-weight: 700; }
  strong { color: #62dfff; font-size: 16px; font-weight: 700; }
}

.second-classroom__items {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;

  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 4px;
    background: rgba(0, 79, 127, 0.22);
  }

  span { overflow: hidden; color: #9ecae8; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  strong { color: #d4f4ff; font-family: var(--student-font-number); font-size: 16px; font-weight: 700; }
}

.quality-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    padding: 8px 12px;
    border: 1px solid rgba(255, 209, 102, 0.22);
    border-radius: 4px;
    background: rgba(119, 83, 13, 0.14);
    color: #e6d4a0;
    font-size: 15px;
    font-weight: 600;
  }
}

.career-matches {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(67, 231, 175, 0.12);
  border-radius: 5px;
  background: rgba(0, 50, 69, 0.25);

  div {
    display: grid;
    grid-template-columns: 160px 1fr 44px;
    align-items: center;
    gap: 8px;
  }

  span { overflow: hidden; color: #c5e4f6; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }

  i {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(0, 69, 91, 0.68);

    b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #20c997, #52e8bf); }
  }

  strong { color: #5ce8bd; font-family: var(--student-font-number); font-size: 15px; font-weight: 700; text-align: right; }
}

.graduation-progress {
  display: flex !important;
  align-items: center;
  gap: 7px;

  i {
    width: 9px;
    height: 9px;
    flex-shrink: 0;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 9px currentColor;
  }

  &--low { color: #55e995 !important; }
  &--medium { color: #facc15 !important; }
  &--high { color: #ff7474 !important; }
}

.graduation-note {
  padding: 10px 12px;
  border: 1px solid rgba(155, 140, 255, 0.16);
  border-radius: 5px;
  background: rgba(55, 45, 117, 0.16);

  span { color: #a8b4db; font-size: 14px; font-weight: 600; }
  strong { margin-left: 9px; color: #d2cbff; font-size: 17px; font-weight: 700; }
  p { margin: 7px 0 0; color: #aebfd3; font-size: 14px; line-height: 1.45; }
}

.development-insight {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-left: 2px solid var(--card-accent);
  border-radius: 3px;
  background: color-mix(in srgb, var(--card-accent) 7%, rgba(0, 28, 60, 0.7));

  span {
    padding: 4px 9px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--card-accent) 12%, transparent);
    color: var(--card-accent);
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
  }

  p {
    margin: 0;
    overflow: hidden;
    color: #c2e0f0;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.development-card__action {
  width: 100%;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: auto;
  border: 1px solid color-mix(in srgb, var(--card-accent) 28%, transparent);
  border-radius: 4px;
  background: color-mix(in srgb, var(--card-accent) 10%, transparent);
  color: color-mix(in srgb, var(--card-accent) 82%, white);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--card-accent) 50%, transparent);
    background: color-mix(in srgb, var(--card-accent) 16%, transparent);
  }
}

.development-nav {
  position: absolute;
  top: 46%;
  z-index: 2;
  width: 38px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  border: 1px solid rgba(0, 199, 255, 0.34);
  border-radius: 5px;
  background: rgba(0, 30, 64, 0.86);
  color: #62ddff;
  font-size: 26px;
  cursor: pointer;

  &--left { left: 0; }
  &--right { right: 0; }
}

.development-pagination {
  position: absolute;
  left: 50%;
  bottom: 2px;
  display: flex;
  align-items: center;
  gap: 7px;
  transform: translateX(-50%);

  button {
    width: 20px;
    height: 4px;
    padding: 0;
    border: 0;
    border-radius: 99px;
    background: rgba(105, 164, 200, 0.35);
    cursor: pointer;

    &.active {
      width: 34px;
      background: #28d6ff;
      box-shadow: 0 0 8px rgba(40, 214, 255, 0.55);
    }
  }

  span { margin-left: 3px; color: #6f9ec2; font-size: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .development-track { transition: none; }
}
</style>

import DashIcon from './DashIcon';
import type { IconKind } from './DashIcon';
import { GpaRankChart, HighPotentialTrendChart } from './charts/HighPotentialCharts';
import {
  dashboardData,
  getHighPotentialModule,
  type HighPotentialModuleId
} from '../data/mockData';

type AcademicModule = Extract<ReturnType<typeof getHighPotentialModule>, { id: 'academic' }>;
type CompetitionModule = Extract<ReturnType<typeof getHighPotentialModule>, { id: 'competition' }>;
type LeadershipModule = Extract<ReturnType<typeof getHighPotentialModule>, { id: 'leadership' }>;
type RuralModule = Extract<ReturnType<typeof getHighPotentialModule>, { id: 'rural' }>;
type InternshipModule = Extract<ReturnType<typeof getHighPotentialModule>, { id: 'internship' }>;
type CareerModule = Extract<ReturnType<typeof getHighPotentialModule>, { id: 'career' }>;

function ModuleShell({
  iconKind,
  title,
  desc,
  children
}: {
  iconKind: IconKind;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="hp-detail-block">
      <header>
        <DashIcon kind={iconKind} size={22} />
        <div>
          <h2>{title}</h2>
          <p>{desc}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function AcademicDetail({ data }: { data: NonNullable<AcademicModule> }) {
  return (
    <ModuleShell iconKind={data.iconKind} title={data.title} desc={data.desc}>
      <div className="hp-tags">
        {data.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="hp-mini-stats hp-mini-stats--detail">
        {data.stats.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}<small>{item.unit}</small></strong>
          </div>
        ))}
      </div>
      <div className="hp-detail-chart">
        <div className="chart-frame__title">GPA 排名曲线</div>
        <GpaRankChart terms={data.gpaTrend.terms} ranks={data.gpaTrend.ranks} />
      </div>
      <div className="hp-courses">
        <span className="hp-courses__label">优势课程高亮</span>
        <div className="hp-courses__list">
          {data.highlightCourses.map((c) => (
            <em key={c}>{c}</em>
          ))}
        </div>
      </div>
    </ModuleShell>
  );
}

function CompetitionDetail({ data }: { data: NonNullable<CompetitionModule> }) {
  return (
    <ModuleShell iconKind={data.iconKind} title={data.title} desc={data.desc}>
      <div className="hp-mini-stats hp-mini-stats--detail">
        {data.stats.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}<small>{item.unit}</small></strong>
          </div>
        ))}
      </div>
      <ul className="hp-timeline hp-timeline--detail">
        {data.timeline.map((item) => (
          <li key={`${item.date}-${item.title}`}>
            <time>{item.date}</time>
            <strong>{item.title}</strong>
            <small>{item.level}</small>
          </li>
        ))}
      </ul>
      <div className="hp-ai">
        <span>AI 推荐</span>
        <ul>
          {data.aiRecommend.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </ModuleShell>
  );
}

function LeadershipDetail({ data }: { data: NonNullable<LeadershipModule> }) {
  return (
    <ModuleShell iconKind={data.iconKind} title={data.title} desc={data.desc}>
      <ul className="hp-highlights hp-highlights--detail">
        {data.highlights.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}<small>{item.unit}</small></strong>
          </li>
        ))}
      </ul>
      <div className="hp-events">
        <span>典型活动</span>
        <ul>
          {data.events.map((event) => (
            <li key={event}>{event}</li>
          ))}
        </ul>
      </div>
    </ModuleShell>
  );
}

function RuralDetail({ data }: { data: NonNullable<RuralModule> }) {
  return (
    <ModuleShell iconKind={data.iconKind} title={data.title} desc={data.desc}>
      <ul className="hp-highlights hp-highlights--detail">
        {data.highlights.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}<small>{item.unit}</small></strong>
          </li>
        ))}
      </ul>
      <ul className="hp-teams hp-teams--detail">
        {data.teams.map((team) => (
          <li key={team.name}>
            <strong>{team.name}</strong>
            <span>{team.place}</span>
            <em>{team.result}</em>
          </li>
        ))}
      </ul>
    </ModuleShell>
  );
}

function InternshipDetail({ data }: { data: NonNullable<InternshipModule> }) {
  return (
    <ModuleShell iconKind={data.iconKind} title={data.title} desc={data.desc}>
      <ul className="hp-achievements hp-achievements--detail">
        {data.achievements.map((item) => (
          <li key={item.title}>
            <DashIcon kind={item.iconKind} size={18} />
            <div>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </div>
          </li>
        ))}
      </ul>
    </ModuleShell>
  );
}

function CareerDetail({ data }: { data: NonNullable<CareerModule> }) {
  return (
    <ModuleShell iconKind={data.iconKind} title={data.title} desc={data.desc}>
      <ul className="hp-paths hp-paths--detail">
        {data.paths.map((item) => (
          <li key={item.label}>
            <div className="hp-paths__head">
              <span>{item.label}</span>
              <strong>{item.value}<small>{item.unit}</small></strong>
            </div>
            <small>{item.detail}</small>
          </li>
        ))}
      </ul>
      <div className="hp-spotlight">
        <span>发展亮点</span>
        <ul>
          {data.spotlight.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </ModuleShell>
  );
}

function renderDetail(moduleId: HighPotentialModuleId) {
  const module = getHighPotentialModule(moduleId);
  if (!module) return null;

  switch (module.id) {
    case 'academic':
      return <AcademicDetail data={module} />;
    case 'competition':
      return <CompetitionDetail data={module} />;
    case 'leadership':
      return <LeadershipDetail data={module} />;
    case 'rural':
      return <RuralDetail data={module} />;
    case 'internship':
      return <InternshipDetail data={module} />;
    case 'career':
      return <CareerDetail data={module} />;
    default:
      return null;
  }
}

interface HighPotentialDetailPageProps {
  moduleId: HighPotentialModuleId;
  onBack: () => void;
}

export default function HighPotentialDetailPage({ moduleId, onBack }: HighPotentialDetailPageProps) {
  const module = getHighPotentialModule(moduleId);
  const { highPotential: hp } = dashboardData;

  if (!module) {
    return null;
  }

  return (
    <div className="hp-detail-page dashboard cockpit">
      <div className="dashboard-scanline" aria-hidden="true" />
      <header className="hp-detail-page__header">
        <button type="button" className="hp-detail-page__back" onClick={onBack}>
          ← 返回驾驶舱
        </button>
        <div className="hp-detail-page__title">
          <DashIcon kind={module.iconKind} size={24} />
          <div>
            <h1>{hp.title}</h1>
            <span>{module.title} · 详细数据</span>
          </div>
        </div>
        <div className="hp-detail-page__meta">
          <span>高潜学生 <strong>{hp.summary.total}</strong> 人</span>
          <span>本学期 <strong className="up">{hp.summary.change}</strong></span>
        </div>
      </header>
      <main className="hp-detail-page__body">
        {renderDetail(moduleId)}
      </main>
    </div>
  );
}

export function parseHighPotentialRoute(hash: string): HighPotentialModuleId | null {
  const match = hash.match(/^#\/high-potential\/([\w-]+)$/);
  if (!match) return null;
  const id = match[1] as HighPotentialModuleId;
  return getHighPotentialModule(id) ? id : null;
}

export function openHighPotentialDetail(id: HighPotentialModuleId) {
  window.location.hash = `#/high-potential/${id}`;
}

export function closeHighPotentialDetail() {
  window.location.hash = '';
}

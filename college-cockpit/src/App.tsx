import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import CoreMetric from './components/CoreMetric';
import MetricCard from './components/MetricCard';
import Panel from './components/Panel';
import { dashboardData } from './data/mockData';
import HighPotentialPanel from './components/HighPotentialPanel';
import HighPotentialDetailPage, {
  closeHighPotentialDetail,
  parseHighPotentialRoute
} from './components/HighPotentialDetailPage';
import KeyTasksDetailPage, {
  closeKeyTasksDetail,
  parseKeyTasksRoute
} from './components/KeyTasksDetailPage';
import TaskProgressPanel from './components/TaskProgressPanel';
import TeachingPanel from './components/TeachingPanel';
import TeachingCourseDetailPage, {
  closeTeachingCourseDetail,
  parseTeachingCourseRoute
} from './components/TeachingCourseDetailPage';
import ResearchPlatformDetailPage, {
  closeResearchPlatformDetail,
  openResearchPlatformDetail,
  parseResearchPlatformRoute
} from './components/ResearchPlatformDetailPage';
import StudentEmploymentDetailPage, {
  closeStudentEmploymentDetail,
  openStudentEmploymentDetail,
  parseStudentEmploymentRoute
} from './components/StudentEmploymentDetailPage';
import WarningPanel from './components/WarningPanel';
import WarningDetailPage, {
  closeWarningDetail,
  parseWarningRoute
} from './components/WarningDetailPage';
import {
  EmploymentPieChart,
  SimpleHBarChart
} from './components/charts/CockpitCharts';

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="chart-frame">
      <div className="chart-frame__title">{title}</div>
      <div className="chart-frame__body">{children}</div>
    </div>
  );
}

function CoreGauge() {
  const { overview } = dashboardData;
  const indexValue = Number.parseFloat(overview.index);
  const gaugePercent = Number.isFinite(indexValue) ? Math.min(100, Math.max(0, indexValue)) : 0;
  const gaugeDeg = `${gaugePercent * 3.6}deg`;

  const positionClass: Record<string, string> = {
    tl: 'core-orbit--tl',
    ml: 'core-orbit--ml',
    bl: 'core-orbit--bl',
    tr: 'core-orbit--tr',
    mr: 'core-orbit--mr',
    br: 'core-orbit--br'
  };

  return (
    <section className="core-hero-stage">
      <div className="core-hero-stage__glow" aria-hidden="true" />

      {overview.metrics.map((metric) => (
        <CoreMetric
          key={metric.label}
          variant="hero"
          side={['tl', 'ml', 'bl'].includes(metric.position) ? 'left' : 'right'}
          className={positionClass[metric.position] ?? ''}
          label={metric.label}
          value={metric.value}
          unit={'unit' in metric ? metric.unit : undefined}
          trend={'trend' in metric ? metric.trend : undefined}
          iconKind={metric.iconKind}
        />
      ))}

      <div className="core-hero-core">
        <div className="core-gauge-square">
          <div className="core-gauge core-gauge--hero">
            <div className="core-gauge__scan-ring" aria-hidden="true" />
            <div className="core-gauge__orbit-ring core-gauge__orbit-ring--1" aria-hidden="true" />
            <div className="core-gauge__orbit-ring core-gauge__orbit-ring--2" aria-hidden="true" />
            <div className="core-gauge__outer-ring" aria-hidden="true" />
            <div className="core-gauge__halo" aria-hidden="true" />
            <div className="core-gauge__track" aria-hidden="true" />
            <div
              className="core-gauge__progress"
              aria-hidden="true"
              style={{ '--gauge-deg': gaugeDeg } as CSSProperties}
            />
            <div className="core-gauge__ticks" />
            <div className="core-gauge__ring core-gauge__ring--outer" />
            <div className="core-gauge__ring core-gauge__ring--inner" />
            <div className="core-gauge__content">
              <span>{overview.indexLabel}</span>
              <strong>{overview.index}</strong>
              <small>（满分100）</small>
              <b>★★★★★</b>
            </div>
          </div>
        </div>

        <div className="core-hero-platform" aria-hidden="true">
          <div className="core-hero-platform__beam core-hero-platform__beam--1" />
          <div className="core-hero-platform__beam core-hero-platform__beam--2" />
          <div className="core-hero-platform__beam core-hero-platform__beam--3" />
          <div className="core-hero-platform__disc core-hero-platform__disc--1" />
          <div className="core-hero-platform__disc core-hero-platform__disc--2" />
          <div className="core-hero-platform__disc core-hero-platform__disc--3" />
          <div className="core-hero-platform__city">
            <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
          </div>
        </div>
      </div>
    </section>
  );
}

type AppRoute =
  | { kind: 'high-potential'; id: NonNullable<ReturnType<typeof parseHighPotentialRoute>> }
  | { kind: 'key-tasks' }
  | { kind: 'warning'; id: NonNullable<ReturnType<typeof parseWarningRoute>> }
  | { kind: 'teaching-courses' }
  | { kind: 'research-platforms' }
  | { kind: 'student-employment' };

function parseAppRoute(hash: string): AppRoute | null {
  const hpId = parseHighPotentialRoute(hash);
  if (hpId) return { kind: 'high-potential', id: hpId };
  if (parseKeyTasksRoute(hash)) return { kind: 'key-tasks' };
  const warningId = parseWarningRoute(hash);
  if (warningId) return { kind: 'warning', id: warningId };
  if (parseTeachingCourseRoute(hash)) return { kind: 'teaching-courses' };
  if (parseResearchPlatformRoute(hash)) return { kind: 'research-platforms' };
  if (parseStudentEmploymentRoute(hash)) return { kind: 'student-employment' };
  return null;
}

export default function App() {
  const [route, setRoute] = useState(() => parseAppRoute(window.location.hash));

  useEffect(() => {
    const syncRoute = () => setRoute(parseAppRoute(window.location.hash));
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  if (route?.kind === 'high-potential') {
    return <HighPotentialDetailPage moduleId={route.id} onBack={closeHighPotentialDetail} />;
  }

  if (route?.kind === 'key-tasks') {
    return <KeyTasksDetailPage onBack={closeKeyTasksDetail} />;
  }

  if (route?.kind === 'warning') {
    return <WarningDetailPage categoryId={route.id} onBack={closeWarningDetail} />;
  }

  if (route?.kind === 'teaching-courses') {
    return <TeachingCourseDetailPage onBack={closeTeachingCourseDetail} />;
  }

  if (route?.kind === 'research-platforms') {
    return <ResearchPlatformDetailPage onBack={closeResearchPlatformDetail} />;
  }

  if (route?.kind === 'student-employment') {
    return <StudentEmploymentDetailPage onBack={closeStudentEmploymentDetail} />;
  }

  return <CockpitDashboard />;
}

function CockpitDashboard() {
  const { tasks, studentWork, research, highPotential } = dashboardData;

  return (
    <div className="dashboard cockpit">
      <div className="dashboard-scanline" aria-hidden="true" />
      <div className="cockpit-hud" aria-hidden="true">
        <span className="cockpit-hud__corner cockpit-hud__corner--tl" />
        <span className="cockpit-hud__corner cockpit-hud__corner--tr" />
        <span className="cockpit-hud__corner cockpit-hud__corner--bl" />
        <span className="cockpit-hud__corner cockpit-hud__corner--br" />
        <span className="cockpit-hud__ring" />
      </div>
      <Header />
      <main className="cockpit-main">
        <div className="cockpit-column cockpit-column--left">
          <Panel number={1} title={tasks.title} iconKind="task" className="panel--key-tasks">
            <TaskProgressPanel tasks={tasks} />
          </Panel>
          <Panel number={2} title={highPotential.title} iconKind="potential" className="panel--high-potential">
            <HighPotentialPanel />
          </Panel>
        </div>

        <div className="cockpit-column cockpit-column--center">
          <div className="cockpit-hero">
            <CoreGauge />
          </div>
          <Panel number={6} title={dashboardData.warning.title} iconKind="warning" className="panel--warning">
            <WarningPanel />
          </Panel>
        </div>

        <div className="cockpit-column cockpit-column--right">
          <Panel number={4} title={dashboardData.teaching.title} iconKind="academic">
            <TeachingPanel />
          </Panel>
          <Panel number={5} title={research.title} iconKind="research">
            <div className="research-grid">
              <div className="research-kpis research-kpis--auto">
                {research.kpis.map((kpi) => (
                  <div className="research-kpi" key={kpi.label}>
                    <span>{kpi.label}</span>
                    <strong>
                      {kpi.value}
                      {'unit' in kpi && kpi.unit ? <small>{kpi.unit}</small> : null}
                    </strong>
                    {'trend' in kpi && kpi.trend ? <em>{kpi.trend}</em> : null}
                  </div>
                ))}
              </div>
              <div className="research-chart-full">
                <div className="chart-frame chart-frame--teaching">
                  <div className="chart-frame__head">
                    <span className="chart-frame__title">团队平台</span>
                    <button type="button" className="chart-frame__link" onClick={openResearchPlatformDetail}>
                      查看详情 ›
                    </button>
                  </div>
                  <div className="chart-frame__body chart-frame__body--tall">
                    <SimpleHBarChart data={research.platforms} unit="个" gridLeft={96} />
                  </div>
                </div>
              </div>
            </div>
          </Panel>
          <Panel number={3} title={studentWork.title} iconKind="students">
            <div className="student-work-grid">
              <div className="kpi-row kpi-row--auto">
                {studentWork.kpis.map((kpi) => (
                  <MetricCard key={kpi.label} {...kpi} size="sm" layout="balance" />
                ))}
              </div>
              <div className="split-charts">
                <div className="chart-frame chart-frame--teaching">
                  <div className="chart-frame__head">
                    <span className="chart-frame__title">就业情况</span>
                    <button type="button" className="chart-frame__link" onClick={openStudentEmploymentDetail}>
                      查看详情 ›
                    </button>
                  </div>
                  <div className="chart-frame__body chart-frame__body--tall">
                    <EmploymentPieChart data={studentWork.employmentDist} />
                  </div>
                </div>
                <div className="chart-frame chart-frame--teaching">
                  <div className="chart-frame__head">
                    <span className="chart-frame__title">就业分布（地区排行）</span>
                    <button type="button" className="chart-frame__link" onClick={openStudentEmploymentDetail}>
                      查看详情 ›
                    </button>
                  </div>
                  <div className="chart-frame__body chart-frame__body--tall">
                    <SimpleHBarChart data={studentWork.employmentRegions} unit="%" gridLeft={96} />
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </main>
      <FooterNav />
    </div>
  );
}

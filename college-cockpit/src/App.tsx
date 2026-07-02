import type { CSSProperties } from 'react';
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import CoreMetric from './components/CoreMetric';
import DashIcon from './components/DashIcon';
import MetricCard from './components/MetricCard';
import Panel from './components/Panel';
import { dashboardData } from './data/mockData';
import HighPotentialPanel from './components/HighPotentialPanel';
import {
  EmploymentPieChart,
  ExcellenceTrendChart,
  FundingTrendChart,
  SimpleHBarChart,
  TaskProgressList,
  WarningMonitorChart
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

function WarningPanel() {
  const { warning } = dashboardData;

  return (
    <div className="warning-panel">
      <div className="warning-panel__left">
        <div className="warning-panel__section-title">预警指标（近三个月）</div>
        <ul className="warning-panel__list">
          {warning.indicators.map((item) => (
            <li className={`warning-panel__item warning-panel__item--${item.tone}`} key={item.label}>
              <div className="warning-panel__badge">
                <DashIcon kind={item.iconKind} size={24} />
              </div>
              <div className="warning-panel__info">
                <span>{item.label}</span>
                <strong>
                  {item.value}
                  {'unit' in item && item.unit ? <small>{item.unit}</small> : null}
                </strong>
                {'delta' in item && item.delta ? <em>{item.delta}</em> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="warning-panel__chart">
        <div className="warning-panel__chart-title">预警趋势（近六个月）</div>
        <div className="warning-panel__chart-body">
          <WarningMonitorChart
            months={warning.trend.months}
            academic={warning.trend.academic}
            mental={warning.trend.mental}
            employment={warning.trend.employment}
            research={warning.trend.research}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { tasks, studentWork, teaching, research, highPotential } = dashboardData;

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
          <Panel number={1} title={tasks.title} iconKind="task">
            <TaskProgressList items={tasks.items} />
          </Panel>
          <Panel number={2} title={studentWork.title} iconKind="students">
            <div className="student-work-grid">
              <div className="kpi-row">
                {studentWork.kpis.map((kpi) => (
                  <MetricCard key={kpi.label} {...kpi} size="sm" />
                ))}
              </div>
              <div className="split-charts">
                <ChartFrame title="2025届就业分布">
                  <EmploymentPieChart data={studentWork.employmentDist} />
                </ChartFrame>
                <ChartFrame title="学生素质发展">
                  <SimpleHBarChart data={studentWork.qualityDev} unit="%" />
                </ChartFrame>
              </div>
            </div>
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
          <Panel number={4} title={teaching.title} iconKind="academic">
            <div className="teaching-grid">
              <div className="kpi-row">
                {teaching.kpis.map((kpi) => (
                  <MetricCard key={kpi.label} {...kpi} size="sm" />
                ))}
              </div>
              <div className="split-charts">
                <ChartFrame title="教学评价优秀率趋势">
                  <ExcellenceTrendChart years={teaching.excellenceTrend.years} rates={teaching.excellenceTrend.rates} />
                </ChartFrame>
                <ChartFrame title="课程建设">
                  <SimpleHBarChart data={teaching.courseConstruction} unit="门" />
                </ChartFrame>
              </div>
            </div>
          </Panel>
          <Panel number={5} title={research.title} iconKind="research">
            <div className="research-grid">
              <div className="research-kpis">
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
              <div className="split-charts">
                <ChartFrame title="科研经费趋势">
                  <FundingTrendChart
                    years={research.fundingTrend.years}
                    vertical={research.fundingTrend.vertical}
                    horizontal={research.fundingTrend.horizontal}
                  />
                </ChartFrame>
                <ChartFrame title="团队平台">
                  <SimpleHBarChart data={research.platforms} unit="个" />
                </ChartFrame>
              </div>
            </div>
          </Panel>
          <Panel number={7} title={highPotential.title} iconKind="potential" className="panel--high-potential">
            <HighPotentialPanel />
          </Panel>
        </div>
      </main>
      <FooterNav />
    </div>
  );
}

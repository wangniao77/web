import DashIcon from './DashIcon';
import { GpaRankChart, HighPotentialTrendChart } from './charts/HighPotentialCharts';
import { dashboardData } from '../data/mockData';

export default function HighPotentialPanel() {
  const { highPotential: hp } = dashboardData;

  return (
    <div className="high-potential">
      <div className="high-potential__summary">
        <div className="high-potential__summary-item">
          <span>高潜学生总数</span>
          <strong>{hp.summary.total}<small>人</small></strong>
        </div>
        <div className="high-potential__summary-item">
          <span>本学期变化</span>
          <strong className="up">{hp.summary.change}</strong>
        </div>
        <div className="high-potential__summary-chart">
          <HighPotentialTrendChart months={hp.summary.trend.months} counts={hp.summary.trend.counts} />
        </div>
      </div>

      <div className="high-potential__grid">
        <section className="hp-block hp-block--academic">
          <header>
            <DashIcon kind="academic" size={18} />
            <h4>{hp.academic.title}</h4>
          </header>
          <p className="hp-block__desc">{hp.academic.desc}</p>
          <div className="hp-tags">
            {hp.academic.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="hp-block__chart">
            <div className="chart-frame__title">GPA 排名曲线</div>
            <GpaRankChart terms={hp.academic.gpaTrend.terms} ranks={hp.academic.gpaTrend.ranks} />
          </div>
          <div className="hp-courses">
            <span className="hp-courses__label">优势课程高亮</span>
            <div className="hp-courses__list">
              {hp.academic.highlightCourses.map((c) => (
                <em key={c}>{c}</em>
              ))}
            </div>
          </div>
        </section>

        <section className="hp-block hp-block--competition">
          <header>
            <DashIcon kind="trophy" size={18} />
            <h4>{hp.competition.title}</h4>
          </header>
          <p className="hp-block__desc">{hp.competition.desc}</p>
          <ul className="hp-timeline">
            {hp.competition.timeline.map((item) => (
              <li key={item.title}>
                <time>{item.date}</time>
                <strong>{item.title}</strong>
                <small>{item.level}</small>
              </li>
            ))}
          </ul>
          <div className="hp-ai">
            <span>AI 推荐</span>
            <ul>
              {hp.competition.aiRecommend.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="hp-block hp-block--leadership">
          <header>
            <DashIcon kind="community" size={18} />
            <h4>{hp.leadership.title}</h4>
          </header>
          <p className="hp-block__desc">{hp.leadership.desc}</p>
          <ul className="hp-highlights">
            {hp.leadership.highlights.map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}<small>{item.unit}</small></strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="hp-block hp-block--internship">
          <header>
            <DashIcon kind="briefcase" size={18} />
            <h4>{hp.internship.title}</h4>
          </header>
          <p className="hp-block__desc">{hp.internship.desc}</p>
          <ul className="hp-achievements">
            {hp.internship.achievements.map((item) => (
              <li key={item.title}>
                <DashIcon kind={item.iconKind} size={16} />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

import DashIcon from './DashIcon';
import { dashboardData } from '../data/mockData';

interface StudentEmploymentDetailPageProps {
  onBack: () => void;
}

export default function StudentEmploymentDetailPage({ onBack }: StudentEmploymentDetailPageProps) {
  const { studentWork } = dashboardData;
  const detail = studentWork.employmentDetail;

  return (
    <div className="teach-detail-page dashboard cockpit">
      <div className="dashboard-scanline" aria-hidden="true" />
      <header className="teach-detail-page__header">
        <button type="button" className="teach-detail-page__back" onClick={onBack}>
          ← 返回驾驶舱
        </button>
        <div className="teach-detail-page__title">
          <DashIcon kind="placement" size={24} />
          <div>
            <h1>{studentWork.title}</h1>
            <span>2025届就业情况 · 详细数据</span>
          </div>
        </div>
        <div className="teach-detail-page__meta">
          <span>就业率 <strong>{studentWork.kpis[1].value}%</strong></span>
          <span>就业满意度 <strong>{studentWork.kpis[0].value}%</strong></span>
        </div>
      </header>

      <main className="teach-detail-page__body">
        <div className="emp-detail-overview">
          {detail.overview.map((item) => (
            <div key={item.label} className="emp-detail-overview__item">
              <span>{item.label}</span>
              <strong>
                {item.value}
                <small>{item.unit}</small>
              </strong>
            </div>
          ))}
        </div>

        <section className="teach-detail-section">
          <header className="teach-detail-section__head">
            <h2>就业去向分布</h2>
            <span>{detail.byDirection.length} 类</span>
          </header>
          <div className="teach-detail-table-wrap">
            <table className="teach-detail-table">
              <thead>
                <tr>
                  <th>去向类别</th>
                  <th>人数</th>
                  <th>占比</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {detail.byDirection.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.count} 人</td>
                    <td>{row.percent}%</td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="teach-detail-section">
          <header className="teach-detail-section__head">
            <h2>重点就业单位</h2>
            <span>Top {detail.topEmployers.length}</span>
          </header>
          <div className="teach-detail-table-wrap">
            <table className="teach-detail-table">
              <thead>
                <tr>
                  <th>单位名称</th>
                  <th>行业</th>
                  <th>录用人数</th>
                  <th>平均起薪</th>
                </tr>
              </thead>
              <tbody>
                {detail.topEmployers.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.industry}</td>
                    <td>{row.count} 人</td>
                    <td>{row.avgSalary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="teach-detail-section">
          <header className="teach-detail-section__head">
            <h2>各专业就业情况</h2>
            <span>{detail.byMajor.length} 个专业</span>
          </header>
          <div className="teach-detail-table-wrap">
            <table className="teach-detail-table">
              <thead>
                <tr>
                  <th>专业</th>
                  <th>就业率</th>
                  <th>毕业人数</th>
                  <th>主要去向</th>
                </tr>
              </thead>
              <tbody>
                {detail.byMajor.map((row) => (
                  <tr key={row.major}>
                    <td>{row.major}</td>
                    <td>{row.rate}%</td>
                    <td>{row.headcount} 人</td>
                    <td>{row.topDirection}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export function parseStudentEmploymentRoute(hash: string): boolean {
  return hash === '#/student/employment';
}

export function openStudentEmploymentDetail() {
  window.location.hash = '#/student/employment';
}

export function closeStudentEmploymentDetail() {
  window.location.hash = '';
}

import DashIcon from './DashIcon';
import { dashboardData } from '../data/mockData';

interface ResearchPlatformDetailPageProps {
  onBack: () => void;
}

export default function ResearchPlatformDetailPage({ onBack }: ResearchPlatformDetailPageProps) {
  const { research } = dashboardData;
  const total = research.platforms.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="teach-detail-page dashboard cockpit">
      <div className="dashboard-scanline" aria-hidden="true" />
      <header className="teach-detail-page__header">
        <button type="button" className="teach-detail-page__back" onClick={onBack}>
          ← 返回驾驶舱
        </button>
        <div className="teach-detail-page__title">
          <DashIcon kind="research" size={24} />
          <div>
            <h1>{research.title}</h1>
            <span>团队平台 · 分类明细</span>
          </div>
        </div>
        <div className="teach-detail-page__meta">
          <span>平台总数 <strong>{total}</strong> 个</span>
        </div>
      </header>

      <main className="teach-detail-page__body">
        {research.platformDetails.map((group) => {
          const summary = research.platforms.find((item) => item.name === group.category);

          return (
            <section key={group.category} className="teach-detail-section">
              <header className="teach-detail-section__head">
                <h2>{group.category}</h2>
                <span>{summary?.value ?? group.items.length} 个</span>
              </header>
              <div className="teach-detail-table-wrap">
                <table className="teach-detail-table">
                  <thead>
                    <tr>
                      <th>平台/团队名称</th>
                      <th>级别</th>
                      <th>负责人</th>
                      <th>成员数</th>
                      <th>成立时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td>{item.level}</td>
                        <td>{item.leader}</td>
                        <td>{item.members} 人</td>
                        <td>{item.foundedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

export function parseResearchPlatformRoute(hash: string): boolean {
  return hash === '#/research/platforms';
}

export function openResearchPlatformDetail() {
  window.location.hash = '#/research/platforms';
}

export function closeResearchPlatformDetail() {
  window.location.hash = '';
}

import DashIcon from './DashIcon';
import {
  dashboardData,
  getWarningCategory,
  getWarningRecords,
  type WarningCategoryId
} from '../data/mockData';

const LEVEL_LABEL = {
  高: '高风险',
  中: '中风险',
  低: '低风险'
} as const;

interface WarningDetailPageProps {
  categoryId: WarningCategoryId;
  onBack: () => void;
}

export default function WarningDetailPage({ categoryId, onBack }: WarningDetailPageProps) {
  const category = getWarningCategory(categoryId);
  const records = getWarningRecords(categoryId);
  const { warning } = dashboardData;

  if (!category) {
    return null;
  }

  return (
    <div className="warn-detail-page dashboard cockpit">
      <div className="dashboard-scanline" aria-hidden="true" />
      <header className="warn-detail-page__header">
        <button type="button" className="warn-detail-page__back" onClick={onBack}>
          ← 返回驾驶舱
        </button>
        <div className="warn-detail-page__title">
          <DashIcon kind={category.iconKind} size={24} />
          <div>
            <h1>{warning.title}</h1>
            <span>{category.label} · 明细名单</span>
          </div>
        </div>
        <div className="warn-detail-page__meta">
          <span>当前预警 <strong>{category.value}</strong> {category.unit}</span>
          <span className={`warn-detail-page__delta warn-detail-page__delta--${category.deltaTrend}`}>
            {category.delta}
          </span>
        </div>
      </header>

      <main className="warn-detail-page__body">
        <p className="warn-detail-page__desc">{category.desc}</p>

        <div className="warn-detail-table-wrap">
          <table className="warn-detail-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>学号</th>
                <th>专业</th>
                <th>年级</th>
                <th>具体问题</th>
                <th>风险等级</th>
                <th>更新时间</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.studentId} className={`warn-detail-table__row--${row.level}`}>
                  <td>{row.name}</td>
                  <td>{row.studentId}</td>
                  <td>{row.major}</td>
                  <td>{row.grade}</td>
                  <td>{row.issue}</td>
                  <td>
                    <span className={`warn-detail-table__level warn-detail-table__level--${row.level}`}>
                      {LEVEL_LABEL[row.level]}
                    </span>
                  </td>
                  <td>{row.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="warn-detail-page__note">
          以上为示例数据，共展示 {records.length} 条记录。实际接入后可对接学工、教务与科研系统实时同步。
        </p>
      </main>
    </div>
  );
}

export function parseWarningRoute(hash: string): WarningCategoryId | null {
  const match = hash.match(/^#\/warning\/([\w-]+)$/);
  if (!match) return null;
  const id = match[1] as WarningCategoryId;
  return getWarningCategory(id) ? id : null;
}

export function openWarningDetail(id: WarningCategoryId) {
  window.location.hash = `#/warning/${id}`;
}

export function closeWarningDetail() {
  window.location.hash = '';
}

import { render, screen } from '@testing-library/react';
import App from '../App';
import { dashboardData } from '../data/mockData';

describe('dashboard data contract', () => {
  it('keeps the requested Top10 major ranking and excludes unrelated labels', () => {
    expect(dashboardData.studentMap.majorRanking).toHaveLength(10);
    expect(dashboardData.studentMap.majorRanking[0]).toEqual({
      name: '计算机科学与技术',
      value: 886
    });

    expect(JSON.stringify(dashboardData)).not.toContain('高潜推荐学生群体数量');
  });
});

describe('App', () => {
  it('uses Guangdong University of Finance and Economics branding in the header', () => {
    render(<App />);

    expect(screen.getByAltText('大数据与人工智能学院院徽')).toBeInTheDocument();
    expect(screen.getByText('厚德 励学 笃行 拓新')).toBeInTheDocument();
    expect(screen.queryByText('AI')).not.toBeInTheDocument();
    expect(screen.queryByText('XX大学')).not.toBeInTheDocument();
  });

  it('renders the governance cockpit shell', () => {
    render(<App />);

    expect(screen.getByText('大数据与人工智能学院发展与治理驾驶舱')).toBeInTheDocument();
    expect(screen.getByText('学院综合发展指数')).toBeInTheDocument();
    expect(screen.getByText('年度重点任务推进')).toBeInTheDocument();
    expect(screen.getByText('双一流建设')).toBeInTheDocument();
    expect(screen.getAllByText('推进中').length).toBeGreaterThan(0);
    expect(screen.getAllByText('需关注').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '查看详情 →' })).toBeInTheDocument();
    expect(screen.getByText('学生就业与前景')).toBeInTheDocument();
    expect(screen.queryByText('学生素质发展')).not.toBeInTheDocument();
    expect(screen.getByText('教学质量与运行')).toBeInTheDocument();
    expect(screen.queryByText('教学评价优秀率趋势')).not.toBeInTheDocument();
    expect(screen.getByText('课程建设')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '查看详情 ›' }).length).toBe(4);
    expect(screen.getByText('就业情况')).toBeInTheDocument();
    expect(screen.getByText('就业分布（地区排行）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看详情 →' })).toBeInTheDocument();
    expect(screen.getByText('科研创新与团队平台')).toBeInTheDocument();
    expect(screen.getByText('团队平台')).toBeInTheDocument();
    expect(screen.queryByText('科研经费趋势')).not.toBeInTheDocument();
    expect(screen.getByText('预警与风险监测')).toBeInTheDocument();
    expect(screen.getAllByText(/较上月/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('查看名单 ›').length).toBe(4);
    expect(screen.getByText('高潜学生发展画像')).toBeInTheDocument();
    expect(screen.getByText('学业高潜')).toBeInTheDocument();
    expect(screen.getByText('竞赛高潜')).toBeInTheDocument();
    expect(screen.getByText('三下乡实践高潜')).toBeInTheDocument();
    expect(screen.getByText('就业升学高潜')).toBeInTheDocument();
    expect(screen.getByText('点击下列维度卡片，进入详情页查看完整数据')).toBeInTheDocument();
    expect(screen.getByText('高潜人数变化')).toBeInTheDocument();
    expect(screen.getByText('竞赛覆盖率')).toBeInTheDocument();
    expect(screen.queryByText('重要新闻与社会服务')).not.toBeInTheDocument();
    expect(screen.queryByText('综合评价与改进')).not.toBeInTheDocument();
    expect(screen.queryByText('师生反馈通道')).not.toBeInTheDocument();
    expect(screen.getByText('87.6')).toBeInTheDocument();
    expect(screen.getByText('5,680')).toBeInTheDocument();
    expect(screen.getByText('院情总览')).toBeInTheDocument();
    expect(screen.queryByText('高潜推荐学生群体数量')).not.toBeInTheDocument();
  });
});

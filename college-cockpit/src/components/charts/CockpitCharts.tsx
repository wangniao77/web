import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import type { NameValue, TaskProgressItem } from '../../data/mockData';
import BaseChart from './BaseChart';
import {
  axisLabelStyle,
  axisLabelStyleCompact,
  axisStyle,
  chartLabelStyle,
  legendTextStyle,
  nameTextStyle,
  splitLine,
  tooltip,
  verticalGradient
} from './chartTheme';

export function ExcellenceTrendChart({ years, rates }: { years: readonly string[]; rates: readonly number[] }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, formatter: '{b}<br />优秀率：{c}%' },
    grid: { left: 38, right: 12, top: 16, bottom: 22 },
    xAxis: { type: 'category', data: [...years], ...axisStyle },
    yAxis: { type: 'value', min: 75, max: 100, ...axisStyle, axisLabel: { ...axisLabelStyle, formatter: '{value}%' }, splitLine },
    series: [{
      type: 'line',
      smooth: true,
      data: [...rates],
      symbolSize: 6,
      lineStyle: { width: 2.5, color: '#39e6ff', shadowBlur: 8, shadowColor: '#39e6ff' },
      itemStyle: { color: '#39e6ff' },
      areaStyle: { color: 'rgba(57,230,255,0.15)' }
    }]
  }), [rates, years]);

  return <BaseChart option={option} />;
}

export function FundingTrendChart({
  years,
  vertical,
  horizontal
}: {
  years: readonly string[];
  vertical: readonly number[];
  horizontal: readonly number[];
}) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip,
    legend: { top: 0, right: 0, itemWidth: 8, itemHeight: 6, textStyle: legendTextStyle, data: ['纵向经费', '横向经费'] },
    grid: { left: 42, right: 12, top: 28, bottom: 22 },
    xAxis: { type: 'category', data: [...years], ...axisStyle },
    yAxis: { type: 'value', name: '万元', nameTextStyle, ...axisStyle, splitLine },
    series: [
      {
        name: '纵向经费',
        type: 'line',
        smooth: true,
        data: [...vertical],
        lineStyle: { width: 2, color: '#39e6ff' },
        itemStyle: { color: '#39e6ff' }
      },
      {
        name: '横向经费',
        type: 'line',
        smooth: true,
        data: [...horizontal],
        lineStyle: { width: 2, color: '#ffb82e' },
        itemStyle: { color: '#ffb82e' }
      }
    ]
  }), [horizontal, vertical, years]);

  return <BaseChart option={option} />;
}

export function WarningMonitorChart({
  months,
  academic,
  mental,
  employment,
  research
}: {
  months: readonly string[];
  academic: readonly number[];
  mental: readonly number[];
  employment: readonly number[];
  research: readonly number[];
}) {
  const lineSeries = (name: string, data: readonly number[], color: string) => ({
    name,
    type: 'line' as const,
    smooth: true,
    symbol: 'circle',
    symbolSize: 7,
    data: [...data],
    lineStyle: { width: 2.5, color, shadowBlur: 10, shadowColor: color },
    itemStyle: { color, borderColor: '#fff', borderWidth: 1, shadowBlur: 8, shadowColor: color },
    emphasis: { focus: 'series' as const }
  });

  const option = useMemo<EChartsOption>(() => ({
    tooltip,
    legend: {
      top: 2,
      right: 4,
      itemWidth: 10,
      itemHeight: 6,
      textStyle: legendTextStyle,
      data: ['学业', '心理', '就业', '科研经费']
    },
    grid: { left: 44, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: [...months], ...axisStyle, boundaryGap: false },
    yAxis: { type: 'value', ...axisStyle, splitLine },
    series: [
      lineSeries('学业', academic, '#ff6b6b'),
      lineSeries('心理', mental, '#ffd166'),
      lineSeries('就业', employment, '#39e6ff'),
      lineSeries('科研经费', research, '#a78bfa')
    ]
  }), [academic, employment, mental, months, research]);

  return <BaseChart option={option} />;
}

export function SimpleHBarChart({ data, unit = '' }: { data: readonly NameValue[]; unit?: string }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, formatter: unit ? `{b}<br />{c}${unit}` : '{b}<br />{c}' },
    grid: { left: 72, right: 36, top: 8, bottom: 8 },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: data.map((d) => d.name), ...axisStyle, axisLabel: axisLabelStyleCompact },
    series: [{
      type: 'bar',
      data: data.map((d) => d.value),
      barWidth: 8,
      itemStyle: { color: verticalGradient('#65f7ff', '#126dff'), borderRadius: 6, shadowBlur: 6, shadowColor: 'rgba(57,230,255,0.45)' },
      label: { show: true, position: 'right', formatter: unit ? `{c}${unit}` : '{c}', ...chartLabelStyle }
    }]
  }), [data, unit]);

  return <BaseChart option={option} />;
}

export function EmploymentPieChart({ data }: { data: readonly NameValue[] }) {
  const colors = ['#39e6ff', '#0d71ff', '#ffb82e', '#30d7a4', '#7a8cff'];
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, trigger: 'item' },
    legend: { bottom: 0, left: 'center', itemWidth: 8, itemHeight: 8, textStyle: legendTextStyle },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      label: { color: '#f2fbff', fontSize: 11, formatter: '{b}\n{d}%' },
      data: data.map((item, i) => ({
        name: item.name,
        value: item.value,
        itemStyle: { color: colors[i % colors.length] }
      }))
    }]
  }), [data]);

  return <BaseChart option={option} />;
}

export function TaskProgressList({ items }: { items: readonly TaskProgressItem[] }) {
  return (
    <ul className="task-progress-list">
      {items.map((item) => (
        <li key={item.name}>
          <span>{item.name}</span>
          <div className="task-progress-list__bar">
            <i style={{ width: `${item.percent}%` }} />
          </div>
          <strong>{item.percent}%</strong>
        </li>
      ))}
    </ul>
  );
}

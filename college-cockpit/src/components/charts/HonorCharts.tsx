import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import type { NameValue } from '../../data/mockData';
import BaseChart from './BaseChart';
import {
  axisLabelStyle,
  axisLabelStyleCompact,
  axisStyle,
  chartLabelStyle,
  horizontalGradient,
  legendTextStyle,
  nameTextStyle,
  orangeGradient,
  splitLine,
  tooltip,
  verticalGradient
} from './chartTheme';

interface HonorStackedBarChartProps {
  years: readonly string[];
  awards: Readonly<Record<string, readonly number[]>>;
}

export function HonorStackedBarChart({ years, awards }: HonorStackedBarChartProps) {
  const awardNames = Object.keys(awards);
  const colors = ['#32e7ff', '#008cff', '#30d7a4', '#ffb82e', '#7a8cff'];
  const option = useMemo<EChartsOption>(() => ({
    tooltip,
    legend: {
      right: 2,
      top: 0,
      orient: 'vertical',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: legendTextStyle,
      data: awardNames
    },
    grid: { left: 34, right: 72, top: 22, bottom: 24 },
    xAxis: { type: 'category', data: years, ...axisStyle },
    yAxis: { type: 'value', name: '人数', nameTextStyle, ...axisStyle, splitLine },
    series: awardNames.map((name, index) => ({
      name,
      type: 'bar',
      stack: 'honor',
      barWidth: 18,
      data: [...awards[name]],
      itemStyle: {
        color: colors[index],
        shadowBlur: 6,
        shadowColor: colors[index]
      }
    }))
  }), [awardNames, awards, years]);

  return <BaseChart option={option} />;
}

export function PotentialBarChart({ data }: { data: readonly NameValue[] }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, formatter: '{b}<br />占比：{c}%' },
    grid: { left: 86, right: 34, top: 12, bottom: 20 },
    xAxis: {
      type: 'value',
      max: 45,
      ...axisStyle,
      axisLabel: { ...axisLabelStyle, formatter: '{value}%' },
      splitLine
    },
    yAxis: { type: 'category', inverse: true, data: data.map((item) => item.name), ...axisStyle },
    series: [
      {
        type: 'bar',
        data: data.map((item, index) => ({
          value: item.value,
          itemStyle: { color: index < 2 ? orangeGradient() : horizontalGradient('#ff663f', '#39e6ff') }
        })),
        barWidth: 12,
        itemStyle: { borderRadius: 8 },
        label: { show: true, position: 'right', formatter: '{c}%', color: '#fff3d2', fontSize: 12, fontWeight: 600 }
      }
    ]
  }), [data]);

  return <BaseChart option={option} />;
}

export function MajorRankingChart({ data }: { data: readonly NameValue[] }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip,
    grid: { left: 110, right: 34, top: 8, bottom: 8 },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: data.map((item) => item.name.replace('（创新实验班）', '\n（创新实验班）').replace('（数据治理）', '\n（数据治理）')),
      ...axisStyle,
      axisLabel: axisLabelStyleCompact
    },
    series: [
      {
        type: 'bar',
        data: data.map((item) => item.value),
        barWidth: 8,
        itemStyle: {
          color: verticalGradient('#65f7ff', '#126dff'),
          borderRadius: 8,
          shadowBlur: 8,
          shadowColor: 'rgba(57,230,255,0.55)'
        },
        label: { show: true, position: 'right', ...chartLabelStyle }
      }
    ]
  }), [data]);

  return <BaseChart option={option} />;
}

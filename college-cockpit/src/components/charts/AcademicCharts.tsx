import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import type { NameValue } from '../../data/mockData';
import BaseChart from './BaseChart';
import {
  axisLabelStyle,
  axisLabelStyleCompact,
  axisStyle,
  chartLabelStyle,
  compactMajorName,
  horizontalGradient,
  legendTextStyle,
  nameTextStyle,
  orangeGradient,
  splitLine,
  tooltip,
  verticalGradient
} from './chartTheme';

export function GpaDistributionChart({ data }: { data: readonly NameValue[] }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip,
    grid: { left: 34, right: 8, top: 18, bottom: 22 },
    xAxis: { type: 'category', data: data.map((item) => item.name), ...axisStyle },
    yAxis: { type: 'value', name: '人数', nameTextStyle, ...axisStyle, splitLine },
    series: [
      {
        type: 'bar',
        data: data.map((item) => item.value),
        barWidth: 16,
        itemStyle: {
          color: verticalGradient(),
          borderRadius: [4, 4, 0, 0],
          shadowBlur: 10,
          shadowColor: 'rgba(0,200,255,0.55)'
        },
        label: { show: true, position: 'top', ...chartLabelStyle }
      }
    ]
  }), [data]);

  return <BaseChart option={option} />;
}

interface AcademicWarningTrendChartProps {
  quarters: readonly string[];
  people: readonly number[];
  rate: readonly number[];
}

export function AcademicWarningTrendChart({ quarters, people, rate }: AcademicWarningTrendChartProps) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip,
    legend: {
      top: 0,
      right: 2,
      itemWidth: 8,
      itemHeight: 6,
      textStyle: legendTextStyle,
      data: ['预警人数', '预警率']
    },
    grid: { left: 34, right: 28, top: 28, bottom: 22 },
    xAxis: { type: 'category', data: quarters, ...axisStyle },
    yAxis: [
      { type: 'value', ...axisStyle, splitLine },
      { type: 'value', ...axisStyle, axisLabel: { ...axisLabelStyle, formatter: '{value}%' }, splitLine: { show: false } }
    ],
    series: [
      {
        name: '预警人数',
        type: 'line',
        smooth: true,
        data: [...people],
        symbolSize: 7,
        lineStyle: { width: 2, color: '#39e6ff', shadowBlur: 10, shadowColor: '#39e6ff' },
        itemStyle: { color: '#39e6ff' },
        areaStyle: { color: 'rgba(0,200,255,0.12)' }
      },
      {
        name: '预警率',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [...rate],
        symbolSize: 7,
        lineStyle: { width: 2, color: '#ffb82e', shadowBlur: 10, shadowColor: '#ffb82e' },
        itemStyle: { color: '#ffb82e' }
      }
    ]
  }), [people, quarters, rate]);

  return <BaseChart option={option} />;
}

export function MajorFailRateChart({ data }: { data: readonly NameValue[] }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, formatter: '{b}<br />挂科率：{c}%' },
    grid: { left: 118, right: 28, top: 10, bottom: 18 },
    xAxis: {
      type: 'value',
      max: 15,
      ...axisStyle,
      axisLabel: { ...axisLabelStyle, formatter: '{value}%' },
      splitLine
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: data.map((item) => compactMajorName(item.name)),
      ...axisStyle,
      axisLabel: axisLabelStyleCompact
    },
    series: [
      {
        type: 'bar',
        data: data.map((item) => item.value),
        barWidth: 8,
        itemStyle: { color: horizontalGradient(), borderRadius: 6, shadowBlur: 8, shadowColor: 'rgba(57,230,255,0.5)' },
        label: { show: true, position: 'right', formatter: '{c}%', ...chartLabelStyle }
      }
    ]
  }), [data]);

  return <BaseChart option={option} />;
}

export function PracticeCategoryChart({ data }: { data: readonly NameValue[] }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, formatter: '{b}<br />参与率：{c}%' },
    grid: { left: 62, right: 28, top: 12, bottom: 16 },
    xAxis: {
      type: 'value',
      max: 100,
      ...axisStyle,
      axisLabel: { ...axisLabelStyle, formatter: '{value}%' },
      splitLine
    },
    yAxis: { type: 'category', inverse: true, data: data.map((item) => item.name), ...axisStyle },
    series: [
      {
        type: 'bar',
        data: data.map((item) => item.value),
        barWidth: 10,
        itemStyle: { color: orangeGradient(), borderRadius: 8, shadowBlur: 8, shadowColor: 'rgba(255,184,46,0.45)' },
        label: { show: true, position: 'right', formatter: '{c}%', color: '#fff3d2', fontSize: 12, fontWeight: 600 }
      }
    ]
  }), [data]);

  return <BaseChart option={option} />;
}

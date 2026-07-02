import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import type { NameValue } from '../../data/mockData';
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
  mental,
  employment
}: {
  months: readonly string[];
  mental: readonly number[];
  employment: readonly number[];
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
      data: ['心理', '就业']
    },
    grid: { left: 40, right: 14, top: 28, bottom: 22 },
    xAxis: { type: 'category', data: [...months], ...axisStyle, boundaryGap: false },
    yAxis: { type: 'value', ...axisStyle, splitLine },
    series: [
      lineSeries('心理', mental, '#ffd166'),
      lineSeries('就业', employment, '#39e6ff')
    ]
  }), [employment, mental, months]);

  return <BaseChart option={option} />;
}

export function CreditCompletionChart({
  categories,
  junior,
  senior,
  threshold
}: {
  categories: readonly string[];
  junior: readonly number[];
  senior: readonly number[];
  threshold: number;
}) {
  const option = useMemo<EChartsOption>(() => {
    const gradient = (top: string, bottom: string) => ({
      type: 'linear' as const,
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: top },
        { offset: 1, color: bottom }
      ]
    });

    const barSeries = (name: string, data: readonly number[], normalTop: string, normalBottom: string) => ({
      name,
      type: 'bar' as const,
      barMaxWidth: 16,
      data: data.map((value) => ({
        value,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color:
            value < threshold
              ? gradient('#ff8a4a', '#ff3b3b')
              : gradient(normalTop, normalBottom)
        }
      })),
      label: { show: true, position: 'top' as const, formatter: '{c}%', ...chartLabelStyle }
    });

    return {
      tooltip: { ...tooltip, axisPointer: { type: 'shadow' as const }, valueFormatter: (v) => `${v}%` },
      legend: { top: 2, right: 4, itemWidth: 10, itemHeight: 6, textStyle: legendTextStyle, data: ['大三', '大四'] },
      grid: { left: 42, right: 14, top: 30, bottom: 26 },
      xAxis: { type: 'category', data: [...categories], ...axisStyle, axisLabel: axisLabelStyleCompact },
      yAxis: {
        type: 'value',
        name: '完成率',
        max: 100,
        nameTextStyle,
        ...axisStyle,
        axisLabel: { ...axisLabelStyle, formatter: '{value}%' },
        splitLine
      },
      series: [
        barSeries('大三', junior, '#5fd0ff', '#0d71ff'),
        barSeries('大四', senior, '#6effc2', '#12a86e')
      ]
    };
  }, [categories, junior, senior, threshold]);

  return <BaseChart option={option} />;
}

export function SimpleHBarChart({ data, unit = '', gridLeft = 72 }: { data: readonly NameValue[]; unit?: string; gridLeft?: number }) {
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, formatter: unit ? `{b}<br />{c}${unit}` : '{b}<br />{c}' },
    grid: { left: gridLeft, right: 36, top: 8, bottom: 8 },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: data.map((d) => d.name), ...axisStyle, axisLabel: axisLabelStyleCompact },
    series: [{
      type: 'bar',
      data: data.map((d) => d.value),
      barWidth: 8,
      itemStyle: { color: verticalGradient('#65f7ff', '#126dff'), borderRadius: 6, shadowBlur: 6, shadowColor: 'rgba(57,230,255,0.45)' },
      label: { show: true, position: 'right', formatter: unit ? `{c}${unit}` : '{c}', ...chartLabelStyle }
    }]
  }), [data, unit, gridLeft]);

  return <BaseChart option={option} />;
}

export function EmploymentPieChart({ data }: { data: readonly NameValue[] }) {
  const colors = ['#39e6ff', '#0d71ff', '#ffb82e', '#30d7a4', '#7a8cff'];
  const option = useMemo<EChartsOption>(() => ({
    tooltip: { ...tooltip, trigger: 'item', formatter: '{b}<br />{c}%' },
    series: [{
      type: 'pie',
      radius: ['40%', '60%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: true,
      label: {
        color: '#eef9ff',
        fontSize: 13,
        fontWeight: 600,
        formatter: '{b} {d}%'
      },
      labelLine: { length: 10, length2: 12, lineStyle: { color: 'rgba(140,200,240,0.6)' } },
      data: data.map((item, i) => ({
        name: item.name,
        value: item.value,
        itemStyle: { color: colors[i % colors.length] }
      }))
    }]
  }), [data]);

  return <BaseChart option={option} />;
}


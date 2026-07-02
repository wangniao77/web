import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface BaseChartProps {
  option: EChartsOption;
  className?: string;
}

export default function BaseChart({ option, className = '' }: BaseChartProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    if (!nodeRef.current) return undefined;

    const chart = echarts.init(nodeRef.current);
    chartRef.current = chart;
    chart.setOption(
      {
        animation: true,
        animationDuration: 1400,
        animationEasing: 'cubicOut',
        animationDurationUpdate: 900,
        ...option
      },
      true
    );

    const resize = () => chart.resize();
    let observer: ResizeObserver | undefined;
    if ('ResizeObserver' in window) {
      observer = new ResizeObserver(resize);
      observer.observe(nodeRef.current);
    }
    window.addEventListener('resize', resize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(
      {
        animation: true,
        animationDuration: 1400,
        animationEasing: 'cubicOut',
        animationDurationUpdate: 900,
        ...option
      },
      true
    );
  }, [option]);

  return <div ref={nodeRef} className={`chart ${className}`} />;
}

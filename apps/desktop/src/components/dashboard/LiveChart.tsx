import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LiveChartProps {
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
  height?: number;
  yAxisUnit?: string;
}

export const LiveChart: React.FC<LiveChartProps> = ({
  title,
  labels,
  datasets,
  height = 280,
  yAxisUnit = '',
}) => {
  const chartData = {
    labels: labels.length > 0 ? labels : ['0s'],
    datasets: datasets.map((d) => ({
      ...d,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.3,
      fill: true,
    })),
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Turn off animation for 60fps data streaming without CPU stutter
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12, weight: '600' },
          boxWidth: 12,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(16, 23, 38, 0.95)',
        titleColor: '#00f2fe',
        bodyColor: '#f1f5f9',
        borderColor: '#1e293b',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y} ${yAxisUnit}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
        },
        ticks: {
          color: '#64748b',
          font: { size: 10, family: 'JetBrains Mono' },
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
        },
        ticks: {
          color: '#64748b',
          font: { size: 10, family: 'JetBrains Mono' },
          callback: (value: any) => `${value}${yAxisUnit}`,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between" style={{ height: `${height}px` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-['Outfit',sans-serif]">{title}</h3>
        <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-mono">60fps Canvas</span>
      </div>
      <div className="flex-1 w-full relative">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

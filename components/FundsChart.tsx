'use client';

import { useState, useEffect, useRef } from 'react';

interface FundsChartProps {
  currentValue: number;
  className?: string;
}

export default function FundsChart({ currentValue, className = '' }: FundsChartProps) {
  const maxPoints = 20; // Количество точек на графике
  const [dataPoints, setDataPoints] = useState<number[]>(() => {
    // Инициализируем с текущим значением, повторенным несколько раз
    return Array(maxPoints).fill(currentValue);
  });
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setDataPoints(prev => {
      // Добавляем новое значение
      const newPoints = [...prev, currentValue];
      // Ограничиваем количество точек
      if (newPoints.length > maxPoints) {
        newPoints.shift();
      }
      return newPoints;
    });
  }, [currentValue]);

  const calculatePath = (points: number[]): string => {
    if (points.length < 2) return '';

    const width = 300;
    const height = 80;
    const pad = 10;

    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1; // Избегаем деления на ноль

    const stepX = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

    let path = 'M';
    points.forEach((point, index) => {
      const x = pad + index * stepX;
      const y = height - pad - ((point - min) / range) * (height - pad * 2);
      path += index === 0 ? `${x},${y}` : ` L${x},${y}`;
    });

    return path;
  };

  const calculateAreaPath = (points: number[]): string => {
    if (points.length < 2) return '';

    const width = 300;
    const height = 80;
    const pad = 10;

    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;

    const stepX = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

    let path = 'M';
    points.forEach((point, index) => {
      const x = pad + index * stepX;
      const y = height - pad - ((point - min) / range) * (height - pad * 2);
      path += index === 0 ? `${x},${y}` : ` L${x},${y}`;
    });

    // Замыкаем область до нижней линии
    const lastX = pad + (points.length - 1) * stepX;
    const firstX = pad;
    path += ` L${lastX},${height - pad} L${firstX},${height - pad} Z`;

    return path;
  };

  const getLastPointCoords = (points: number[]) => {
    if (points.length < 1) return { x: 0, y: 0 };
    
    const width = 300;
    const height = 80;
    const pad = 10;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const stepX = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;
    const lastPoint = points[points.length - 1];
    const x = pad + (points.length - 1) * stepX;
    const y = height - pad - ((lastPoint - min) / range) * (height - pad * 2);
    return { x, y };
  };

  const pathData = calculatePath(dataPoints);
  const areaPath = calculateAreaPath(dataPoints);

  return (
    <div className={className}>
      <div className="bg-white/50 rounded-lg p-3 border border-green-300/50">
        <div className="text-xs text-gray-600 mb-2 font-medium">Growth Trend</div>
        <svg
          ref={chartRef}
          width="300"
          height="80"
          viewBox="0 0 300 80"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Заполненная область */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#areaGradient)"
              className="transition-all duration-500 ease-out"
            />
          )}
          
          {/* Линия графика */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="rgb(34, 197, 94)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-out"
            />
          )}
          
          {/* Последняя точка */}
          {dataPoints.length > 0 && (() => {
            const { x, y } = getLastPointCoords(dataPoints);
            return (
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="rgb(34, 197, 94)"
                className="animate-pulse"
              />
            );
          })()}
        </svg>
      </div>
    </div>
  );
}


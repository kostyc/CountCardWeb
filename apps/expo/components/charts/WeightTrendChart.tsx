import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import type { WeightChartPoint } from '@countcard/core/utils/recruitWeightAnalytics';
import { spacing, typography, radius } from '@/constants/theme';

interface WeightTrendChartProps {
  points: WeightChartPoint[];
  width: number;
  height?: number;
  lineColor: string;
  labelColor: string;
  gridColor: string;
}

const PADDING = { top: 16, right: 16, bottom: 28, left: 36 };

export function WeightTrendChart({
  points,
  width,
  height = 180,
  lineColor,
  labelColor,
  gridColor,
}: WeightTrendChartProps) {
  const chart = useMemo(() => {
    if (points.length === 0) return null;

    const innerWidth = Math.max(width - PADDING.left - PADDING.right, 40);
    const innerHeight = Math.max(height - PADDING.top - PADDING.bottom, 40);
    const weights = points.map((point) => point.weightPounds);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = Math.max(maxWeight - minWeight, 4);
    const paddedMin = minWeight - range * 0.1;
    const paddedMax = maxWeight + range * 0.1;
    const span = paddedMax - paddedMin;

    const coords = points.map((point, index) => {
      const x =
        points.length === 1
          ? PADDING.left + innerWidth / 2
          : PADDING.left + (index / (points.length - 1)) * innerWidth;
      const y = PADDING.top + innerHeight - ((point.weightPounds - paddedMin) / span) * innerHeight;
      return { ...point, x, y };
    });

    const polyline = coords.map((point) => `${point.x},${point.y}`).join(' ');

    return { coords, polyline, paddedMin, paddedMax };
  }, [points, width, height]);

  if (!chart || points.length === 0) {
    return (
      <View style={[styles.empty, { width, height, borderColor: gridColor }]}>
        <Text style={[styles.emptyText, { color: labelColor }]}>No weigh-ins yet</Text>
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Line
          x1={PADDING.left}
          y1={height - PADDING.bottom}
          x2={width - PADDING.right}
          y2={height - PADDING.bottom}
          stroke={gridColor}
          strokeWidth={1}
        />
        <Line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={height - PADDING.bottom}
          stroke={gridColor}
          strokeWidth={1}
        />
        <SvgText x={4} y={PADDING.top + 4} fill={labelColor} fontSize={10}>
          {Math.round(chart.paddedMax)}
        </SvgText>
        <SvgText x={4} y={height - PADDING.bottom} fill={labelColor} fontSize={10}>
          {Math.round(chart.paddedMin)}
        </SvgText>
        {points.length > 1 ? (
          <Polyline points={chart.polyline} fill="none" stroke={lineColor} strokeWidth={2.5} />
        ) : null}
        {chart.coords.map((point) => (
          <Circle key={point.entryId} cx={point.x} cy={point.y} r={4} fill={lineColor} />
        ))}
        {chart.coords.map((point, index) => (
          <SvgText
            key={`${point.entryId}-label`}
            x={point.x}
            y={height - 8}
            fill={labelColor}
            fontSize={9}
            textAnchor={index === 0 ? 'start' : index === chart.coords.length - 1 ? 'end' : 'middle'}
          >
            {point.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  emptyText: {
    ...typography.body,
    fontSize: 13,
  },
});

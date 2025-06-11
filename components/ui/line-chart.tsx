"use client";

import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface LineChartProps {
  data: { date: string; views: number; messages: number; connections: number }[];
}

export function LineChart({ data }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data}>
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#8884d8"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="messages"
          stroke="#82ca9d"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="connections"
          stroke="#ffc658"
          strokeWidth={2}
          dot={false}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
} 
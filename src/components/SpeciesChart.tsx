"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

// สีที่ใช้ในกราฟ สามารถปรับเปลี่ยนได้ตามธีม
const COLORS = ["#34d399", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa"];

type SpeciesData = {
  species: string;
  count: number;
};

export function SpeciesChart({ data }: { data: SpeciesData[] }) {
  const chartData = useMemo(() => data.map(item => ({ name: item.species, value: item.count })), [data]);

  if (!chartData || chartData.length === 0) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">ไม่มีข้อมูล</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend iconType="circle" />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={70} // ทำให้เป็น Donut Chart
          outerRadius={100}
          paddingAngle={5}
          stroke="hsl(var(--background))"
          strokeWidth={3}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
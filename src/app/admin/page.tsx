"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#34d399", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#38bdf8", "#f472b6", "#facc15", "#4ade80", "#818cf8"];

export default function AdminPage() {
  const [seedlings, setSeedlings] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("seedlings").select("id,species,height_range,count").then(({ data }) => {
      if (data) setSeedlings(data);
    });
  }, []);

  const total = seedlings.reduce((sum, s) => sum + (s.count || 0), 0);
  const speciesStats = Object.entries(seedlings.reduce((acc, s) => {
    if (!acc[s.species]) acc[s.species] = 0;
    acc[s.species] += s.count || 0;
    return acc;
  }, {} as Record<string, number>)).map(([species, count]) => ({ species, count }));
  const heightStats = Object.entries(seedlings.reduce((acc, s) => {
    if (!acc[s.height_range]) acc[s.height_range] = 0;
    acc[s.height_range] += s.count || 0;
    return acc;
  }, {} as Record<string, number>)).map(([height, count]) => ({ height, count }));

  return (
    <div className="flex flex-col gap-8">
      {/* สถิติหลัก */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-100 to-green-50">
          <CardContent className="py-6 flex flex-col items-center">
            <div className="text-3xl font-bold text-green-700">{total}</div>
            <div className="text-sm text-green-800 mt-1">ต้นกล้าทั้งหมด</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-100 to-blue-50">
          <CardContent className="py-6 flex flex-col items-center">
            <div className="text-3xl font-bold text-blue-700">{speciesStats.length}</div>
            <div className="text-sm text-blue-800 mt-1">ชนิดต้นกล้า</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-100 to-yellow-50">
          <CardContent className="py-6 flex flex-col items-center">
            <div className="text-3xl font-bold text-yellow-700">{heightStats.length}</div>
            <div className="text-sm text-yellow-800 mt-1">ช่วงความสูง</div>
          </CardContent>
        </Card>
      </div>
      {/* กราฟ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow border-0">
          <CardContent className="pt-6">
            <div className="font-semibold mb-2">สัดส่วนต้นกล้าแต่ละชนิด</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={speciesStats} dataKey="count" nameKey="species" cx="50%" cy="50%" outerRadius={80} label>
                  {speciesStats.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow border-0">
          <CardContent className="pt-6">
            <div className="font-semibold mb-2">สัดส่วนต้นกล้าแต่ละช่วงความสูง</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={heightStats} dataKey="count" nameKey="height" cx="50%" cy="50%" outerRadius={80} label>
                  {heightStats.map((entry, idx) => (
                    <Cell key={`cell-h-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
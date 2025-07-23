"use client";
import { useEffect, useState, useMemo, FC, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientOnlyTimestamp } from "@/components/ClientOnlyTimestamp";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, CartesianGrid
} from "recharts";
import { motion } from "framer-motion";
import { Leaf, Sprout, Trees, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Define a vibrant and consistent color palette ---
const COLORS = {
  green: "#10b981", // emerald-500
  blue: "#3b82f6",  // blue-500
  yellow: "#f59e0b",// amber-500
  red: "#ef4444",   // red-500
  purple: "#8b5cf6",// violet-500
  cyan: "#06b6d4",  // cyan-500
};
const COLOR_PALETTE = Object.values(COLORS);

// --- Reusable UI Components ---

// Add DashboardData type
type DashboardData = {
  total: number;
  speciesStats: { name: string; value: number }[];
  heightStats: { name: string; value: number }[];
  growthTrend: { date: string; count: number }[];
  lastGrowthCount: number;
};

/**
 * A stylish card for displaying key statistics with an icon and animation.
 */
const StatCard = ({ title, value, icon: Icon, color, unit }: { title: string, value: number, icon: React.ElementType, color: string, unit: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="overflow-hidden border-l-4 shadow-md transition-transform hover:-translate-y-1" style={{ borderLeftColor: color }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" style={{ color }} />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-foreground">
          <AnimatedNumber value={value} />
        </div>
        <p className="text-xs text-muted-foreground">{unit}</p>
      </CardContent>
    </Card>
  </motion.div>
);

/**
 * A container for charts with a title and entrance animation.
 */
const ChartCard = ({ title, children }: { title: string, children: ReactNode }) => (
   <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80 pr-4">
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

/**
 * A custom tooltip with a modern look for all charts.
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background/90 p-2 shadow-sm backdrop-blur-sm">
        <p className="font-bold text-foreground">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.fill || pld.stroke }}>
            {`${pld.name}: ${pld.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


// --- Main Dashboard Page Component ---

export default function AdminDashboardPage() {
  const router = useRouter();
  const [seedlings, setSeedlings] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [seedlingsRes, batchesRes] = await Promise.all([
          supabase.from("seedlings").select("id,species,height_range,count,batch_id"),
          supabase.from("batches").select("id,batch_code,collected_at")
        ]);

        if (seedlingsRes.error) throw seedlingsRes.error;
        if (batchesRes.error) throw batchesRes.error;

        setSeedlings(seedlingsRes.data || []);
        setBatches(batchesRes.data || []);

      } catch (err: any) {
        setError("ไม่สามารถโหลดข้อมูลได้: " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Memoized Data Processing for Performance ---
  const dashboardData = useMemo<DashboardData | null>(() => {
    if (seedlings.length === 0) return null;

    const total = seedlings.reduce((sum, s) => sum + (s.count || 0), 0);

    const speciesStats = Object.entries(
      seedlings.reduce((acc, s) => {
        acc[s.species] = (acc[s.species] || 0) + (s.count || 0);
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value: Number(value) }));

    const heightStats = Object.entries(
      seedlings.reduce((acc, s) => {
        acc[s.height_range] = (acc[s.height_range] || 0) + (s.count || 0);
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value: Number(value) }));

    const batchCountMap = seedlings.reduce((acc, s) => {
      const batch = batches.find((b: any) => b.id === s.batch_id);
      if (batch?.collected_at) {
        acc[batch.collected_at] = (acc[batch.collected_at] || 0) + (s.count || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const growthTrend = Object.entries(batchCountMap)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
        count: Number(count)
      }));
      
    // **FIX 1:** Safely get the last growth count
    const lastGrowthCount = growthTrend.length > 0 ? Number(growthTrend[growthTrend.length - 1].count) : 0;

    return { total: Number(total), speciesStats, heightStats, growthTrend, lastGrowthCount };
  }, [seedlings, batches]);

  // --- Render Logic with Loading/Error States ---
  if (loading) {
    return (
      <div className="space-y-8">
        <header>
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded-md bg-muted" />
        </header>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted"></div>)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-96 animate-pulse rounded-lg bg-muted"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="flex h-full items-center justify-center text-destructive">{error}</div>;
  }
  
  if (!dashboardData) {
     return <div className="flex h-full items-center justify-center text-muted-foreground">ไม่พบข้อมูลสำหรับแสดงผล</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground">แดชบอร์ด</h1>
        <p className="text-muted-foreground">ภาพรวมข้อมูลโครงการ ณ วันที่ <ClientOnlyTimestamp /></p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="ต้นกล้าทั้งหมด" value={dashboardData.total} icon={Trees} color={COLORS.green} unit="ต้น" />
        <StatCard title="จำนวนชนิด" value={dashboardData.speciesStats.length} icon={Leaf} color={COLORS.blue} unit="ชนิด" />
        <StatCard title="ช่วงความสูง" value={dashboardData.heightStats.length} icon={Sprout} color={COLORS.yellow} unit="ช่วง" />
        <StatCard title="เติบโตล่าสุด" value={dashboardData.lastGrowthCount} icon={TrendingUp} color={COLORS.purple} unit="ต้น (ล่าสุด)" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="สัดส่วนต้นกล้าตามชนิด">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie data={dashboardData.speciesStats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  // **FIX 2:** Add checks for undefined properties
                  if (midAngle === undefined || percent === undefined || innerRadius === undefined || outerRadius === undefined) {
                    return null;
                  }
                  const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                  return (
                    <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-semibold">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {dashboardData.speciesStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} className="focus:outline-none" />
                ))}
              </Pie>
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="แนวโน้มการรวบรวมต้นกล้า">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboardData.growthTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="count" name="จำนวน" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 4, fill: COLORS.blue }} activeDot={{ r: 6 }} fill="url(#lineGradient)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="จำนวนต้นกล้าแต่ละชนิด">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.speciesStats} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }}/>
              <Bar dataKey="value" name="จำนวน" radius={[0, 4, 4, 0]}>
                {dashboardData.speciesStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="จำนวนตามช่วงความสูง">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.heightStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))"/>
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }}/>
              <Bar dataKey="value" name="จำนวน" radius={[4, 4, 0, 0]}>
                 {dashboardData.heightStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

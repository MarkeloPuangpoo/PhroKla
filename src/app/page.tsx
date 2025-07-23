import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { CheckCircle, Clock, Circle } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ClientOnlyTimestamp } from '@/components/ClientOnlyTimestamp'; // import เข้ามา
import { SpeciesChart } from "@/components/SpeciesChart"; // Import component ใหม่

// --- Timeline Component ---
const STAGES = [
  { key: "รวบรวมเมล็ดพันธุ์", label: "รวบรวมเมล็ดพันธุ์", icon: "🌱" },
  { key: "เพาะชำในโรงเรือน", label: "เพาะชำในโรงเรือน", icon: "🌿" },
  { key: "เตรียมพื้นที่ปลูก", label: "เตรียมพื้นที่ปลูก", icon: "🏞️" },
  { key: "วันลงปลูกจริง", label: "วันลงปลูกจริง", icon: "🌳" },
];

function Timeline({ current }: { current: string }) {
  const currentIndex = STAGES.findIndex(stage => stage.key === current);

  return (
    <div className="relative w-full">
      {/* เส้นเชื่อม Timeline */}
      <div className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-0.5 bg-border" />
      
      <ol className="relative space-y-8">
        {STAGES.map((stage, idx) => {
          const status = idx < currentIndex ? "done" : idx === currentIndex ? "doing" : "next";
          
          return (
            <li key={stage.key} className="flex items-center gap-4">
              <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                {status === "done" && <CheckCircle className="h-8 w-8 text-green-500" />}
                {status === "doing" && <Clock className="h-8 w-8 animate-pulse text-yellow-500" />}
                {status === "next" && <Circle className="h-8 w-8 text-muted-foreground/50" />}
              </div>
              <div>
                <h4 className={`font-semibold ${status === "done" ? "text-green-600" : status === "doing" ? "text-yellow-600" : "text-muted-foreground"}`}>{stage.label}</h4>
                <p className="text-sm text-muted-foreground">{stage.icon}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// --- Main Page Component ---
export default async function Home() {
  // --- Data Fetching (Server-Side) ---
  const { data: seedlings } = await supabase.from("seedlings").select("species, height_range, count");
  const { data: projectStatus } = await supabase.from("project_status").select("current_stage").single();
  
  const safeSeedlings = Array.isArray(seedlings) ? seedlings : [];

  // --- Data Processing ---
  const total = safeSeedlings.reduce((sum, s) => sum + (s.count || 0), 0);
  const speciesData = Object.entries(
    safeSeedlings.reduce((acc, s) => {
      if (!acc[s.species]) acc[s.species] = 0;
      acc[s.species] += s.count || 0;
      return acc;
    }, {} as Record<string, number>)
  ).map(([species, count]) => ({ species, count }));

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-muted/20 via-background to-background p-4 sm:p-6 lg:p-8">
      <main className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">สรุปภาพรวมโครงการเพราะกล้า</h1>
          <p className="mt-2 text-lg text-muted-foreground">ข้อมูลล่าสุด ณ วันที่ <ClientOnlyTimestamp /></p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Total Seedlings Card */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/80 to-primary p-8 text-primary-foreground shadow-lg">
              <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
              <h2 className="text-xl font-semibold">จำนวนต้นกล้าทั้งหมด</h2>
              <p className="mt-2 text-6xl font-extrabold">
                <AnimatedNumber value={total} />
                <span className="ml-2 text-4xl font-medium">ต้น</span>
              </p>
            </section>
            
            {/* Seedlings Details Card */}
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">รายละเอียดต้นกล้า</h2>
              <div className="mt-4 overflow-x-auto">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชนิด</TableHead>
                      <TableHead>ช่วงความสูง (cm)</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeSeedlings.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.species}</TableCell>
                        <TableCell>{row.height_range}</TableCell>
                        <TableCell className="text-right">{row.count?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Species Chart Card */}
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4">สัดส่วนตามชนิด</h2>
              <SpeciesChart data={speciesData} />
            </section>

            {/* Project Status Card */}
            <section className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6">สถานะโครงการ</h2>
              <Timeline current={projectStatus?.current_stage || "รวบรวมเมล็ดพันธุ์"} />
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Circle } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";

const STAGES = [
  { key: "รวบรวมเมล็ดพันธุ์", label: "รวบรวมเมล็ดพันธุ์" },
  { key: "เพาะชำในโรงเรือน", label: "เพาะชำในโรงเรือน" },
  { key: "เตรียมพื้นที่ปลูก", label: "เตรียมพื้นที่ปลูก" },
  { key: "วันลงปลูกจริง", label: "วันลงปลูกจริง" },
];

function Timeline({ current }: { current: string }) {
  let found = false;
  return (
    <ol className="relative border-l border-muted-foreground/30 ml-4">
      {STAGES.map((stage, idx) => {
        let status: "done" | "doing" | "next" = "next";
        if (!found && current === stage.key) {
          status = "doing";
          found = true;
        } else if (!found) {
          status = "done";
        }
        return (
          <li key={stage.key} className="mb-8 ml-6 flex items-center">
            <span className="absolute -left-3 flex items-center justify-center">
              {status === "done" && <CheckCircle className="text-green-500" size={24} />}
              {status === "doing" && <Clock className="text-yellow-500 animate-pulse" size={24} />}
              {status === "next" && <Circle className="text-muted-foreground" size={24} />}
            </span>
            <div className="flex flex-col gap-1">
              <span className={`font-semibold ${status === "done" ? "text-green-600" : status === "doing" ? "text-yellow-600" : "text-muted-foreground"}`}>{stage.label}</span>
              <span className="text-xs text-muted-foreground">
                {status === "done" && "เสร็จสิ้น"}
                {status === "doing" && "กำลังดำเนินการ"}
                {status === "next" && "เร็วๆ นี้"}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default async function Home() {
  // ดึงข้อมูลต้นกล้า (seedlings)
  const { data: seedlings } = await supabase.from("seedlings").select("species, height_range, count");
  const safeSeedlings = Array.isArray(seedlings) ? seedlings : [];
  // ดึงสถานะโครงการ
  const { data: projectStatus } = await supabase.from("project_status").select("current_stage").single();

  // รวมทุกต้น
  const total = safeSeedlings.reduce((sum, s) => sum + (s.count || 0), 0);

  // แยกตามชนิด
  const bySpecies = Object.entries(
    safeSeedlings.reduce((acc, s) => {
      if (!acc[s.species]) acc[s.species] = 0;
      acc[s.species] += s.count || 0;
      return acc;
    }, {} as Record<string, number>)
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      {/* ตัวนับต้นกล้า (รวมทุกต้น, แยกตามชนิด, แยกตามช่วงความสูง) */}
      <section className="w-full max-w-2xl bg-card rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">สรุปจำนวนต้นกล้า</h2>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-4xl font-extrabold text-primary">
            <AnimatedNumber value={total} />
          </span>
          <span className="text-lg">ต้น</span>
          <Badge variant="outline">รวมทุกชนิด</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชนิด</TableHead>
              <TableHead>จำนวน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bySpecies.map(([species, count]) => (
              <TableRow key={species}>
                <TableCell>{species}</TableCell>
                <TableCell>{count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-6">
          <div className="font-semibold mb-2">แยกตามชนิดและช่วงความสูง</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชนิด</TableHead>
                <TableHead>ช่วงความสูง (cm)</TableHead>
                <TableHead>จำนวน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeSeedlings.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.species}</TableCell>
                  <TableCell>{row.height_range}</TableCell>
                  <TableCell>{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      {/* สถานะโครงการ (Timeline) */}
      <section className="w-full max-w-2xl bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">สถานะโครงการ</h2>
        <Timeline current={projectStatus?.current_stage || "รวบรวมเมล็ดพันธุ์"} />
      </section>
    </main>
  );
}

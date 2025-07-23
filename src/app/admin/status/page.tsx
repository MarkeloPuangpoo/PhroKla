"use client";
import { useEffect, useState, useCallback, FC } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Circle, Loader2, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- Define the project stages for consistency ---
const PROJECT_STAGES = [
  "รวบรวมเมล็ดพันธุ์",
  "เพาะชำในโรงเรือน",
  "เตรียมพื้นที่ปลูก",
  "วันลงปลูกจริง",
  "เสร็จสิ้นโครงการ",
];

// --- Sub-component: Visual Timeline ---
const ProjectTimeline: FC<{ currentStage: string }> = ({ currentStage }) => {
  const currentIndex = PROJECT_STAGES.indexOf(currentStage);
  return (
    <div className="relative pl-2 py-4">
      {/* The connecting line */}
      <div className="absolute left-6 top-6 h-[calc(100%-3rem)] w-0.5 bg-border" />
      <ol className="relative space-y-8">
        {PROJECT_STAGES.map((stage, idx) => {
          const status = idx < currentIndex ? "done" : idx === currentIndex ? "doing" : "next";
          return (
            <li key={stage} className="flex items-start gap-4">
              <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background ring-4 ring-background">
                {status === "done" && <CheckCircle className="h-8 w-8 text-green-500" />}
                {status === "doing" && <Rocket className="h-7 w-7 animate-pulse text-primary" />}
                {status === "next" && <Circle className="h-7 w-7 text-muted-foreground/30" />}
              </div>
              <div>
                <h4 className={`font-semibold ${status === 'doing' ? 'text-primary' : 'text-foreground'}`}>{stage}</h4>
                <p className="text-sm text-muted-foreground">
                  {status === "done" && "เสร็จสิ้นแล้ว"}
                  {status === "doing" && "กำลังดำเนินการ"}
                  {status === "next" && "ขั้นตอนถัดไป"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// --- Main Page Component ---
export default function StatusPage() {
  const [currentStage, setCurrentStage] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("project_status").select("current_stage").single();
    if (error) {
      setError("ไม่สามารถโหลดข้อมูลสถานะได้");
      console.error(error);
    } else if (data) {
      setCurrentStage(data.current_stage);
      setSelectedStage(data.current_stage);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSaveStatus = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("project_status")
      .update({ current_stage: selectedStage })
      .eq("id", 1); // Assuming the status is always on id=1

    if (error) {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } else {
      setCurrentStage(selectedStage);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-foreground">สถานะโครงการ</h1>
        <p className="text-muted-foreground">อัปเดตและติดตามความคืบหน้าของโครงการ</p>
      </header>

      {/* Main Content Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Control Panel */}
        <div className="lg:col-span-1">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>อัปเดตสถานะ</CardTitle>
              <CardDescription>เลือกขั้นตอนปัจจุบันของโครงการ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
              ) : error ? (
                <p className="text-destructive">{error}</p>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">สถานะปัจจุบัน</label>
                    <Badge variant="secondary" className="ml-2 text-base">{currentStage}</Badge>
                  </div>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสถานะใหม่..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STAGES.map(stage => (
                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleSaveStatus} 
                    disabled={isSaving || currentStage === selectedStage}
                    className="w-full"
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline Visualization */}
        <div className="lg:col-span-2">
           <Card className="shadow-md">
            <CardHeader>
              <CardTitle>ไทม์ไลน์โครงการ</CardTitle>
              <CardDescription>ภาพรวมความคืบหน้าทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 w-full animate-pulse rounded-md bg-muted" />
              ) : (
                <ProjectTimeline currentStage={currentStage} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

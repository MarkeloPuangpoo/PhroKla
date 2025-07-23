"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function StatusPage() {
  const [projectStatus, setProjectStatus] = useState<string>("");
  const [statusEdit, setStatusEdit] = useState("");
  const [editingStatus, setEditingStatus] = useState(false);

  useEffect(() => {
    supabase.from("project_status").select("current_stage").single().then(({ data }) => {
      if (data) setProjectStatus(data.current_stage);
    });
  }, []);

  async function handleSaveStatus() {
    await supabase.from("project_status").update({ current_stage: statusEdit }).eq("id", 1);
    setProjectStatus(statusEdit);
    setEditingStatus(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="shadow border-0">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="font-semibold text-lg">สถานะโครงการ</div>
            {editingStatus ? (
              <div className="flex gap-2 items-center">
                <Input value={statusEdit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStatusEdit(e.target.value)} className="w-48" />
                <Button size="sm" onClick={handleSaveStatus}>บันทึก</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingStatus(false)}>ยกเลิก</Button>
              </div>
            ) : (
              <div className="inline-block px-3 py-1 rounded bg-muted text-primary font-medium">
                {projectStatus}
                <Button size="sm" variant="ghost" className="ml-2 px-2 py-0.5 h-6" onClick={() => { setStatusEdit(projectStatus); setEditingStatus(true); }}>แก้ไข</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LogbookPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState({
    log_date: "",
    activity: "",
    batch_id: "",
    zone_id: "",
    note: ""
  });
  const [batches, setBatches] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
    supabase.from("batches").select("id,batch_code").then(({ data }) => {
      if (data) setBatches(data);
    });
    supabase.from("nursery_zones").select("id,zone_code").then(({ data }) => {
      if (data) setZones(data);
    });
  }, []);

  async function fetchLogs() {
    const { data } = await supabase.from("nursery_logs").select("*, batch_id, zone_id").order("log_date", { ascending: false });
    if (data) setLogs(data);
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("nursery_logs").insert([
      {
        ...form,
        batch_id: form.batch_id || null,
        zone_id: form.zone_id || null
      }
    ]);
    setForm({ log_date: "", activity: "", batch_id: "", zone_id: "", note: "" });
    setShowForm(false);
    setLoading(false);
    fetchLogs();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-lg">สมุดบันทึกกิจกรรมโรงเพาะชำ (Nursery Logbook)</div>
        <Button onClick={() => setShowForm(v => !v)}>{showForm ? "ยกเลิก" : "เพิ่มบันทึกใหม่"}</Button>
      </div>
      {showForm && (
        <form onSubmit={handleAddLog} className="bg-card p-4 rounded-lg shadow flex flex-col gap-3 max-w-xl">
          <div className="flex gap-2">
            <Input type="date" placeholder="วันที่" value={form.log_date} onChange={e => setForm(f => ({ ...f, log_date: e.target.value }))} required />
            <select className="border rounded px-2 py-1 text-sm" value={form.batch_id} onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))}>
              <option value="">เลือกรุ่น (Batch)</option>
              {batches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.batch_code}</option>
              ))}
            </select>
            <select className="border rounded px-2 py-1 text-sm" value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))}>
              <option value="">เลือกโซน (Zone)</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>{z.zone_code}</option>
              ))}
            </select>
          </div>
          <Input placeholder="รายละเอียดกิจกรรม" value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} required />
          <Input placeholder="หมายเหตุ (ถ้ามี)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          <Button type="submit" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
        </form>
      )}
      <Card className="shadow border-0">
        <CardContent className="pt-6">
          <div className="font-semibold mb-2">บันทึกกิจกรรมย้อนหลัง</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">วันที่</th>
                  <th className="px-3 py-2 text-left">รุ่น (Batch)</th>
                  <th className="px-3 py-2 text-left">โซน (Zone)</th>
                  <th className="px-3 py-2 text-left">กิจกรรม</th>
                  <th className="px-3 py-2 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b last:border-b-0 hover:bg-primary/5">
                    <td className="px-3 py-2">{log.log_date}</td>
                    <td className="px-3 py-2">{batches.find((b: any) => b.id === log.batch_id)?.batch_code || '-'}</td>
                    <td className="px-3 py-2">{zones.find((z: any) => z.id === log.zone_id)?.zone_code || '-'}</td>
                    <td className="px-3 py-2">{log.activity}</td>
                    <td className="px-3 py-2">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
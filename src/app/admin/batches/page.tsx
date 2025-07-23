"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [form, setForm] = useState({
    batch_code: "",
    collected_at: "",
    source_name: "",
    gps_latitude: "",
    gps_longitude: "",
    note: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    const { data } = await supabase.from("batches").select("*").order("collected_at", { ascending: false });
    if (data) setBatches(data);
  }

  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("batches").insert([
      {
        ...form,
        gps_latitude: form.gps_latitude ? Number(form.gps_latitude) : null,
        gps_longitude: form.gps_longitude ? Number(form.gps_longitude) : null
      }
    ]);
    setForm({ batch_code: "", collected_at: "", source_name: "", gps_latitude: "", gps_longitude: "", note: "" });
    setShowForm(false);
    setLoading(false);
    fetchBatches();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-lg">จัดการรุ่นต้นกล้า (Batch Management)</div>
        <Button onClick={() => setShowForm(v => !v)}>{showForm ? "ยกเลิก" : "เพิ่มรุ่นใหม่"}</Button>
      </div>
      {showForm && (
        <form onSubmit={handleAddBatch} className="bg-card p-4 rounded-lg shadow flex flex-col gap-3 max-w-xl">
          <div className="flex gap-2">
            <Input placeholder="รหัสรุ่น (Batch Code)" value={form.batch_code} onChange={e => setForm(f => ({ ...f, batch_code: e.target.value }))} required />
            <Input type="date" placeholder="วันที่เก็บ" value={form.collected_at} onChange={e => setForm(f => ({ ...f, collected_at: e.target.value }))} required />
          </div>
          <Input placeholder="ชื่อแหล่งที่มา (Source Name)" value={form.source_name} onChange={e => setForm(f => ({ ...f, source_name: e.target.value }))} />
          <div className="flex gap-2">
            <Input type="number" step="any" placeholder="Latitude" value={form.gps_latitude} onChange={e => setForm(f => ({ ...f, gps_latitude: e.target.value }))} />
            <Input type="number" step="any" placeholder="Longitude" value={form.gps_longitude} onChange={e => setForm(f => ({ ...f, gps_longitude: e.target.value }))} />
          </div>
          <Input placeholder="หมายเหตุ (ถ้ามี)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          <Button type="submit" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
        </form>
      )}
      <Card className="shadow border-0">
        <CardContent className="pt-6">
          <div className="font-semibold mb-2">รายการรุ่นต้นกล้า</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">รหัสรุ่น</th>
                  <th className="px-3 py-2 text-left">วันที่เก็บ</th>
                  <th className="px-3 py-2 text-left">แหล่งที่มา</th>
                  <th className="px-3 py-2 text-left">Latitude</th>
                  <th className="px-3 py-2 text-left">Longitude</th>
                  <th className="px-3 py-2 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr key={batch.id} className="border-b last:border-b-0 hover:bg-primary/5">
                    <td className="px-3 py-2">{batch.batch_code}</td>
                    <td className="px-3 py-2">{batch.collected_at}</td>
                    <td className="px-3 py-2">{batch.source_name}</td>
                    <td className="px-3 py-2">{batch.gps_latitude}</td>
                    <td className="px-3 py-2">{batch.gps_longitude}</td>
                    <td className="px-3 py-2">{batch.note}</td>
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
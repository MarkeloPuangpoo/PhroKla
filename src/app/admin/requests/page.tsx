"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [seedlings, setSeedlings] = useState<any[]>([]);
  const [form, setForm] = useState({
    partner_id: "",
    request_date: "",
    items: [{ seedling_id: "", quantity: 1 }],
    note: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any|null>(null);

  useEffect(() => {
    fetchRequests();
    supabase.from("partners").select("id,name").then(({ data }) => {
      if (data) setPartners(data);
    });
    supabase.from("seedlings").select("id,species,height_range,count").then(({ data }) => {
      if (data) setSeedlings(data);
    });
  }, []);

  async function fetchRequests() {
    const { data } = await supabase.from("seedling_requests").select("*, partner_id").order("request_date", { ascending: false });
    if (data) setRequests(data);
  }

  function handleItemChange(idx: number, key: string, value: any) {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [key]: value } : item)
    }));
  }

  function handleAddItem() {
    setForm(f => ({ ...f, items: [...f.items, { seedling_id: "", quantity: 1 }] }));
  }

  function handleRemoveItem(idx: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  async function handleAddRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // 1. insert request
    const { data: req } = await supabase.from("seedling_requests").insert([
      { partner_id: form.partner_id, request_date: form.request_date, note: form.note, status: "pending" }
    ]).select().single();
    if (req) {
      // 2. insert items
      for (const item of form.items) {
        await supabase.from("seedling_request_items").insert([
          { request_id: req.id, seedling_id: item.seedling_id, quantity: Number(item.quantity) }
        ]);
      }
    }
    setForm({ partner_id: "", request_date: "", items: [{ seedling_id: "", quantity: 1 }], note: "" });
    setShowForm(false);
    setLoading(false);
    fetchRequests();
  }

  async function handleApprove(request: any) {
    // 1. ดึงรายการต้นกล้าในใบคำขอ
    const { data: items } = await supabase.from("seedling_request_items").select("*").eq("request_id", request.id);
    if (!items) return;
    // 2. ตรวจสอบ stock และตัด stock
    for (const item of items) {
      const { data: seedling } = await supabase.from("seedlings").select("count").eq("id", item.seedling_id).single();
      if (seedling && seedling.count >= item.quantity) {
        await supabase.from("seedlings").update({ count: seedling.count - item.quantity }).eq("id", item.seedling_id);
      }
    }
    // 3. อัปเดตสถานะใบคำขอ
    await supabase.from("seedling_requests").update({ status: "approved" }).eq("id", request.id);
    fetchRequests();
  }

  async function handlePrint(request: any) {
    // ดึงรายการต้นกล้าในใบคำขอ
    const { data: items } = await supabase.from("seedling_request_items").select("*, seedling_id").eq("request_id", request.id);
    setPrintData({ request, items });
    setTimeout(() => {
      if (printRef.current) {
        window.print();
      }
    }, 300);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-lg">ใบคำขอรับต้นกล้า (Request Order)</div>
        <Button onClick={() => setShowForm(v => !v)}>{showForm ? "ยกเลิก" : "สร้างใบคำขอใหม่"}</Button>
      </div>
      {showForm && (
        <form onSubmit={handleAddRequest} className="bg-card p-4 rounded-lg shadow flex flex-col gap-3 max-w-xl">
          <select className="border rounded px-2 py-1 text-sm" value={form.partner_id} onChange={e => setForm(f => ({ ...f, partner_id: e.target.value }))} required>
            <option value="">เลือกผู้รับ/เครือข่าย</option>
            {partners.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <Input type="date" placeholder="วันที่" value={form.request_date} onChange={e => setForm(f => ({ ...f, request_date: e.target.value }))} required />
          <div className="flex flex-col gap-2">
            {form.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select className="border rounded px-2 py-1 text-sm" value={item.seedling_id} onChange={e => handleItemChange(idx, "seedling_id", e.target.value)} required>
                  <option value="">เลือกต้นกล้า</option>
                  {seedlings.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.species} ({s.height_range}) - คงเหลือ {s.count}</option>
                  ))}
                </select>
                <Input type="number" min={1} max={seedlings.find((s: any) => s.id === item.seedling_id)?.count || 1} value={item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} required className="w-20" />
                <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveItem(idx)} disabled={form.items.length === 1}>ลบ</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>+ เพิ่มรายการ</Button>
          </div>
          <Input placeholder="หมายเหตุ (ถ้ามี)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          <Button type="submit" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
        </form>
      )}
      <Card className="shadow border-0">
        <CardContent className="pt-6">
          <div className="font-semibold mb-2">ประวัติใบคำขอ</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">วันที่</th>
                  <th className="px-3 py-2 text-left">ผู้รับ</th>
                  <th className="px-3 py-2 text-left">สถานะ</th>
                  <th className="px-3 py-2 text-left">หมายเหตุ</th>
                  <th className="px-3 py-2 text-left">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id} className="border-b last:border-b-0 hover:bg-primary/5">
                    <td className="px-3 py-2">{request.request_date}</td>
                    <td className="px-3 py-2">{partners.find((p: any) => p.id === request.partner_id)?.name || '-'}</td>
                    <td className="px-3 py-2">{request.status}</td>
                    <td className="px-3 py-2">{request.note}</td>
                    <td className="px-3 py-2 flex gap-2">
                      {request.status === "pending" && (
                        <Button size="sm" onClick={() => handleApprove(request)}>อนุมัติ/ตัด stock</Button>
                      )}
                      {request.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => handlePrint(request)}>พิมพ์ใบส่งมอบ</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Print Section (hidden on screen, visible on print) */}
      {printData && (
        <div ref={printRef} className="hidden print:block bg-white p-8">
          <h2 className="text-xl font-bold mb-2">ใบส่งมอบต้นกล้า</h2>
          <div>วันที่: {printData.request.request_date}</div>
          <div>ผู้รับ: {partners.find((p: any) => p.id === printData.request.partner_id)?.name || '-'}</div>
          <div>หมายเหตุ: {printData.request.note}</div>
          <table className="min-w-full text-sm mt-4">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">ต้นกล้า</th>
                <th className="px-3 py-2 text-left">ช่วงความสูง</th>
                <th className="px-3 py-2 text-right">จำนวน</th>
              </tr>
            </thead>
            <tbody>
              {printData.items.map((item: any) => {
                const seedling = seedlings.find((s: any) => s.id === item.seedling_id);
                return (
                  <tr key={item.id}>
                    <td className="px-3 py-2">{seedling?.species || '-'}</td>
                    <td className="px-3 py-2">{seedling?.height_range || '-'}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-8">ลงชื่อผู้รับ: ___________________________</div>
        </div>
      )}
    </div>
  );
} 
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    address: "",
    note: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  async function fetchPartners() {
    const { data } = await supabase.from("partners").select("*").order("name", { ascending: true });
    if (data) setPartners(data);
  }

  async function handleAddPartner(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("partners").insert([
      { ...form }
    ]);
    setForm({ name: "", contact: "", address: "", note: "" });
    setShowForm(false);
    setLoading(false);
    fetchPartners();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-lg">จัดการผู้รับ/เครือข่าย (Partner Management)</div>
        <Button onClick={() => setShowForm(v => !v)}>{showForm ? "ยกเลิก" : "เพิ่มผู้รับใหม่"}</Button>
      </div>
      {showForm && (
        <form onSubmit={handleAddPartner} className="bg-card p-4 rounded-lg shadow flex flex-col gap-3 max-w-xl">
          <Input placeholder="ชื่อผู้รับ/หน่วยงาน" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input placeholder="เบอร์ติดต่อ/อีเมล" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          <Input placeholder="ที่อยู่" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <Input placeholder="หมายเหตุ (ถ้ามี)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          <Button type="submit" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
        </form>
      )}
      <Card className="shadow border-0">
        <CardContent className="pt-6">
          <div className="font-semibold mb-2">รายชื่อผู้รับ/เครือข่าย</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">ชื่อ</th>
                  <th className="px-3 py-2 text-left">ติดต่อ</th>
                  <th className="px-3 py-2 text-left">ที่อยู่</th>
                  <th className="px-3 py-2 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(partner => (
                  <tr key={partner.id} className="border-b last:border-b-0 hover:bg-primary/5">
                    <td className="px-3 py-2">{partner.name}</td>
                    <td className="px-3 py-2">{partner.contact}</td>
                    <td className="px-3 py-2">{partner.address}</td>
                    <td className="px-3 py-2">{partner.note}</td>
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
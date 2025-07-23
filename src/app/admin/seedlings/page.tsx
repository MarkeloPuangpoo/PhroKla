"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

export default function SeedlingsPage() {
  const [seedlings, setSeedlings] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ species: "", height_range: "", count: 0, batch_id: "", zone_id: "" });
  const [editId, setEditId] = useState<number|null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string>("");
  const [heightFilter, setHeightFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [batches, setBatches] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("seedlings").select("id,species,height_range,count,batch_id,zone_id").then(({ data }) => {
      if (data) setSeedlings(data);
    });
    supabase.from("batches").select("id,batch_code").then(({ data }) => {
      if (data) setBatches(data);
    });
    supabase.from("nursery_zones").select("id,zone_code").then(({ data }) => {
      if (data) setZones(data);
    });
  }, []);

  async function handleSaveSeedling() {
    if (!form.species || !form.height_range || !form.count) return;
    await supabase.from("seedlings").insert([{ ...form, count: Number(form.count), batch_id: form.batch_id || null, zone_id: form.zone_id || null }]);
    setOpen(false);
    const { data } = await supabase.from("seedlings").select("id,species,height_range,count,batch_id,zone_id");
    if (data) setSeedlings(data);
  }
  async function handleDeleteSeedling(id: number) {
    await supabase.from("seedlings").delete().eq("id", id);
    const { data } = await supabase.from("seedlings").select("id,species,height_range,count,batch_id,zone_id");
    if (data) setSeedlings(data);
  }
  async function handleEditSeedling() {
    if (!form.species || !form.height_range || !form.count || !editId) return;
    await supabase.from("seedlings").update({ ...form, count: Number(form.count), batch_id: form.batch_id || null, zone_id: form.zone_id || null }).eq("id", editId);
    setOpen(false);
    setEditId(null);
    const { data } = await supabase.from("seedlings").select("id,species,height_range,count,batch_id,zone_id");
    if (data) setSeedlings(data);
  }

  // สร้างรายการชนิดต้นกล้าไม่ซ้ำสำหรับ filter
  const uniqueSpecies = Array.from(new Set(seedlings.map(s => s.species)));
  // สร้างรายการช่วงความสูงไม่ซ้ำสำหรับ filter
  const uniqueHeights = Array.from(new Set(seedlings.map(s => s.height_range)));
  // กรองข้อมูลตาม speciesFilter, heightFilter, และ search
  const filteredSeedlings = seedlings.filter(s =>
    (speciesFilter ? s.species === speciesFilter : true) &&
    (heightFilter ? s.height_range === heightFilter : true) &&
    (
      !search ||
      s.species.toLowerCase().includes(search.toLowerCase()) ||
      s.height_range.toLowerCase().includes(search.toLowerCase()) ||
      String(s.count).includes(search)
    )
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="font-semibold text-lg">ข้อมูลต้นกล้า</div>
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="species-filter" className="text-sm">กรองตามชนิด:</label>
          <select id="species-filter" className="border rounded px-2 py-1 text-sm" value={speciesFilter} onChange={e => setSpeciesFilter(e.target.value)}>
            <option value="">ทั้งหมด</option>
            {uniqueSpecies.map(species => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>
          <label htmlFor="height-filter" className="text-sm ml-2">กรองตามช่วงความสูง:</label>
          <select id="height-filter" className="border rounded px-2 py-1 text-sm" value={heightFilter} onChange={e => setHeightFilter(e.target.value)}>
            <option value="">ทั้งหมด</option>
            {uniqueHeights.map(height => (
              <option key={height} value={height}>{height}</option>
            ))}
          </select>
          <input type="text" placeholder="ค้นหา..." className="border rounded px-2 py-1 text-sm ml-2" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { setForm({ species: "", height_range: "", count: 0, batch_id: "", zone_id: "" }); setEditId(null); }}><PlusIcon className="w-4 h-4" /> เพิ่มข้อมูล</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "แก้ไข" : "เพิ่ม"}ข้อมูลต้นกล้า</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <Input placeholder="ชนิดของต้นไม้" value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} />
              <Input placeholder="ช่วงความสูง (เช่น 10-15)" value={form.height_range} onChange={e => setForm(f => ({ ...f, height_range: e.target.value }))} />
              <Input type="number" placeholder="จำนวน" value={form.count} onChange={e => setForm(f => ({ ...f, count: Number(e.target.value) }))} min={0} />
              <div className="flex gap-2">
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
            </div>
            <DialogFooter>
              <Button type="submit" onClick={editId ? handleEditSeedling : handleSaveSeedling}>บันทึก</Button>
              <DialogClose asChild>
                <Button variant="outline">ยกเลิก</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">ชนิด</th>
              <th className="px-3 py-2 text-left">ช่วงความสูง (cm)</th>
              <th className="px-3 py-2 text-right">จำนวน</th>
              <th className="px-3 py-2 text-left">รุ่น (Batch)</th>
              <th className="px-3 py-2 text-left">โซน (Zone)</th>
              <th className="px-3 py-2 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredSeedlings.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-primary/5">
                <td className="px-3 py-2">{row.species}</td>
                <td className="px-3 py-2">{row.height_range}</td>
                <td className="px-3 py-2 text-right">{row.count}</td>
                <td className="px-3 py-2">{batches.find((b: any) => b.id === row.batch_id)?.batch_code || '-'}</td>
                <td className="px-3 py-2">{zones.find((z: any) => z.id === row.zone_id)?.zone_code || '-'}</td>
                <td className="px-3 py-2 text-center flex gap-2 justify-center">
                  <Button size="icon" variant="outline" className="rounded-full" onClick={() => { setForm({ species: row.species, height_range: row.height_range, count: row.count, batch_id: row.batch_id || "", zone_id: row.zone_id || "" }); setEditId(row.id); setOpen(true); }}><PencilIcon className="w-4 h-4" /></Button>
                  <Button size="icon" variant="destructive" className="rounded-full" onClick={() => handleDeleteSeedling(row.id)}><TrashIcon className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
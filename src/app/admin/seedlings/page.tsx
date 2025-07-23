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
  const [form, setForm] = useState({ species: "", height_range: "", count: 0 });
  const [editId, setEditId] = useState<number|null>(null);

  useEffect(() => {
    supabase.from("seedlings").select("id,species,height_range,count").then(({ data }) => {
      if (data) setSeedlings(data);
    });
  }, []);

  async function handleSaveSeedling() {
    if (!form.species || !form.height_range || !form.count) return;
    await supabase.from("seedlings").insert([{ ...form }]);
    setOpen(false);
    const { data } = await supabase.from("seedlings").select("id,species,height_range,count");
    if (data) setSeedlings(data);
  }
  async function handleDeleteSeedling(id: number) {
    await supabase.from("seedlings").delete().eq("id", id);
    const { data } = await supabase.from("seedlings").select("id,species,height_range,count");
    if (data) setSeedlings(data);
  }
  async function handleEditSeedling() {
    if (!form.species || !form.height_range || !form.count || !editId) return;
    await supabase.from("seedlings").update({ ...form }).eq("id", editId);
    setOpen(false);
    setEditId(null);
    const { data } = await supabase.from("seedlings").select("id,species,height_range,count");
    if (data) setSeedlings(data);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-lg">ข้อมูลต้นกล้า</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { setForm({ species: "", height_range: "", count: 0 }); setEditId(null); }}><PlusIcon className="w-4 h-4" /> เพิ่มข้อมูล</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "แก้ไข" : "เพิ่ม"}ข้อมูลต้นกล้า</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <Input placeholder="ชนิดของต้นไม้" value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))} />
              <Input placeholder="ช่วงความสูง (เช่น 10-15)" value={form.height_range} onChange={e => setForm(f => ({ ...f, height_range: e.target.value }))} />
              <Input type="number" placeholder="จำนวน" value={form.count} onChange={e => setForm(f => ({ ...f, count: Number(e.target.value) }))} min={0} />
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
              <th className="px-3 py-2 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {seedlings.map((row) => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-primary/5">
                <td className="px-3 py-2">{row.species}</td>
                <td className="px-3 py-2">{row.height_range}</td>
                <td className="px-3 py-2 text-right">{row.count}</td>
                <td className="px-3 py-2 text-center flex gap-2 justify-center">
                  <Button size="icon" variant="outline" className="rounded-full" onClick={() => { setForm({ species: row.species, height_range: row.height_range, count: row.count }); setEditId(row.id); setOpen(true); }}><PencilIcon className="w-4 h-4" /></Button>
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
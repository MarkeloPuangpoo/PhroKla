"use client";
import { useEffect, useState, useCallback, useMemo, FC } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Pencil, Search, Leaf, Hash, MapPin, Sprout } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchBar, SearchQuery } from "@/components/SearchBar";
import { FilterPanel, FilterCriteria } from "@/components/FilterPanel";

// --- Type Definitions ---
type Seedling = { id: number; species: string; height_range: string; count: number; batch_id: number | null; zone_id: number | null; survived_count?: number; dead_count?: number };
type Batch = { id: number; batch_code: string; collected_at: string };
type Zone = { id: number; zone_code: string };
const initialFormState = { species: "", height_range: "", count: 0, batch_id: "", zone_id: "", survived_count: 0, dead_count: 0 };

// --- Sub-component: Seedling Form ---
const SeedlingForm: FC<{
  batches: Batch[]; zones: Zone[];
  onSubmit: (form: typeof initialFormState) => void;
  onClose: () => void;
  initialData?: typeof initialFormState;
}> = ({ batches, zones, onSubmit, onClose, initialData }) => {
  const [form, setForm] = useState(initialData || initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setForm(initialData || initialFormState); }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSelectChange = (name: 'batch_id' | 'zone_id') => (value: string) => setForm(f => ({ ...f, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(form);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input name="species" placeholder="ชนิดของต้นไม้" value={form.species} onChange={handleChange} required />
        <Input name="height_range" placeholder="ช่วงความสูง (เช่น 10-15 cm)" value={form.height_range} onChange={handleChange} required />
      </div>
      <Input name="count" type="number" placeholder="จำนวนปลูก" value={form.count} onChange={handleChange} min={0} required />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input name="survived_count" type="number" placeholder="จำนวนรอด" value={form.survived_count} onChange={handleChange} min={0} />
        <Input name="dead_count" type="number" placeholder="จำนวนตาย" value={form.dead_count} onChange={handleChange} min={0} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={String(form.batch_id || '')} onValueChange={handleSelectChange('batch_id')}>
          <SelectTrigger><SelectValue placeholder="เลือกรุ่น (Batch)" /></SelectTrigger>
          <SelectContent>{batches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.batch_code}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(form.zone_id || '')} onValueChange={handleSelectChange('zone_id')}>
          <SelectTrigger><SelectValue placeholder="เลือกโซน (Zone)" /></SelectTrigger>
          <SelectContent>{zones.map(z => <SelectItem key={z.id} value={String(z.id)}>{z.zone_code}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</Button>
      </DialogFooter>
    </form>
  );
};

function exportSeedlingsToCSV(seedlings: any[]) {
  if (!seedlings.length) return;
  const fields = Object.keys(seedlings[0]);
  const csv = [fields.join(",")].concat(
    seedlings.map(row => fields.map(f => `"${(row[f] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `seedlings_export_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// --- Main Page Component ---
export default function SeedlingsPage() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSeedling, setEditingSeedling] = useState<Seedling | null>(null);
  const [deletingSeedlingId, setDeletingSeedlingId] = useState<number | null>(null);

  const [savedQueries, setSavedQueries] = useState<{ name: string; query: SearchQuery }[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("seedlings_saved_queries") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  const saveQuery = (query: SearchQuery) => {
    const name = prompt("ตั้งชื่อคิวรีนี้:");
    if (!name) return;
    const newSaved = [...savedQueries, { name, query }];
    setSavedQueries(newSaved);
    localStorage.setItem("seedlings_saved_queries", JSON.stringify(newSaved));
  };

  const [advancedFilters, setAdvancedFilters] = useState<FilterCriteria>({});
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({ text: "" });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sldRes, bthRes, zonRes] = await Promise.all([
        supabase.from("seedlings").select("*"),
        supabase.from("batches").select("id,batch_code,collected_at"),
        supabase.from("nursery_zones").select("id,zone_code")
      ]);
      if (sldRes.error) throw sldRes.error; if (bthRes.error) throw bthRes.error; if (zonRes.error) throw zonRes.error;
      setSeedlings(sldRes.data as Seedling[]); setBatches(bthRes.data as Batch[]); setZones(zonRes.data as Zone[]);
    } catch (err: any) { setError("ไม่สามารถโหลดข้อมูลได้: " + err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ฟังก์ชันรวมการค้นหา/กรอง
  const applyAllFilters = (data: Seedling[]) => {
    let filtered = [...data];
    // Full-text search
    if (searchQuery.text) {
      const searchLower = searchQuery.text.toLowerCase();
      filtered = filtered.filter(s =>
        s.species.toLowerCase().includes(searchLower) ||
        s.height_range.toLowerCase().includes(searchLower) ||
        String(s.count).includes(searchLower)
      );
    }
    // Multi-criteria (species, height)
    if (searchQuery.species) filtered = filtered.filter(s => s.species === searchQuery.species);
    if (searchQuery.height) filtered = filtered.filter(s => s.height_range === searchQuery.height);
    // Date range
    if (searchQuery.dateFrom) filtered = filtered.filter(s => {
      const batch = batches.find(b => b.id === s.batch_id);
      return batch && batch.collected_at >= searchQuery.dateFrom!;
    });
    if (searchQuery.dateTo) filtered = filtered.filter(s => {
      const batch = batches.find(b => b.id === s.batch_id);
      return batch && batch.collected_at <= searchQuery.dateTo!;
    });
    // Advanced multi-select
    if (advancedFilters.species?.length) filtered = filtered.filter(s => advancedFilters.species!.includes(s.species));
    if (advancedFilters.height?.length) filtered = filtered.filter(s => advancedFilters.height!.includes(s.height_range));
    if (advancedFilters.batch?.length) filtered = filtered.filter(s => advancedFilters.batch!.includes(getBatchCode(s.batch_id)));
    if (advancedFilters.zone?.length) filtered = filtered.filter(s => advancedFilters.zone!.includes(getZoneCode(s.zone_id)));
    if (advancedFilters.dateFrom) filtered = filtered.filter(s => {
      const batch = batches.find(b => b.id === s.batch_id);
      return batch && batch.collected_at >= advancedFilters.dateFrom!;
    });
    if (advancedFilters.dateTo) filtered = filtered.filter(s => {
      const batch = batches.find(b => b.id === s.batch_id);
      return batch && batch.collected_at <= advancedFilters.dateTo!;
    });
    return filtered;
  };

  const filteredSeedlings = useMemo(() => applyAllFilters(seedlings), [seedlings, searchQuery, advancedFilters, batches]);

  const handleFormSubmit = async (form: typeof initialFormState) => {
    const dataToUpsert = {
      ...form,
      count: Number(form.count),
      batch_id: form.batch_id ? Number(form.batch_id) : null,
      zone_id: form.zone_id ? Number(form.zone_id) : null,
    };

    const query = editingSeedling
      ? supabase.from("seedlings").update(dataToUpsert).eq("id", editingSeedling.id)
      : supabase.from("seedlings").insert([dataToUpsert]);

    const { error } = await query;
    if (error) { alert("เกิดข้อผิดพลาด: " + error.message); } else {
      setIsFormOpen(false);
      setEditingSeedling(null);
      await fetchData();
    }
  };

  const handleDelete = async () => {
    if (deletingSeedlingId === null) return;
    const { error } = await supabase.from("seedlings").delete().eq("id", deletingSeedlingId);
    if (error) { alert("เกิดข้อผิดพลาด: " + error.message); } else {
      await fetchData();
    }
    setDeletingSeedlingId(null);
  };

  const getBatchCode = (id: number | null) => batches.find(b => b.id === id)?.batch_code || '-';
  const getZoneCode = (id: number | null) => zones.find(z => z.id === id)?.zone_code || '-';

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ข้อมูลต้นกล้า</h1>
          <p className="text-muted-foreground">จัดการสต็อกต้นกล้าทั้งหมดในโครงการ</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => { setEditingSeedling(null); setIsFormOpen(true); }}>
          <PlusCircle className="h-5 w-5" /> เพิ่มข้อมูลต้นกล้า
        </Button>
      </header>

      <div className="flex justify-end mb-2">
        <Button variant="outline" onClick={() => exportSeedlingsToCSV(seedlings)}>
          Export CSV
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ค้นหาชนิด, ความสูง, จำนวน..." className="pl-8" value={searchQuery.text} onChange={e => setSearchQuery(q => ({ ...q, text: e.target.value }))} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Content rendering logic */}
          {isLoading ? <div className="text-center py-10">กำลังโหลด...</div> : error ? <div className="text-center text-destructive py-10">{error}</div> : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredSeedlings.map(s => (
                  <Card key={s.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-primary flex items-center gap-2"><Leaf size={16}/>{s.species}</div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingSeedling(s); setIsFormOpen(true); }}><Pencil size={16}/></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingSeedlingId(s.id)}><Trash2 size={16}/></Button>
                      </div>
                    </div>
                    <div className="border-b"></div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2"><Sprout size={14} className="text-muted-foreground"/>{s.height_range} cm</div>
                      <div className="flex items-center gap-2"><Hash size={14} className="text-muted-foreground"/>{s.count.toLocaleString()} ต้น</div>
                      <div className="flex items-center gap-2"><Hash size={14} className="text-muted-foreground"/>Batch: {getBatchCode(s.batch_id)}</div>
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-muted-foreground"/>Zone: {getZoneCode(s.zone_id)}</div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชนิด</TableHead><TableHead>ช่วงความสูง (cm)</TableHead>
                      <TableHead>จำนวน</TableHead><TableHead>รอด/ตาย</TableHead>
                      <TableHead>รุ่น (Batch)</TableHead>
                      <TableHead>โซน (Zone)</TableHead><TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSeedlings.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.species}</TableCell>
                        <TableCell>{s.height_range}</TableCell>
                        <TableCell>{s.count.toLocaleString()}</TableCell>
                        <TableCell>{typeof s.survived_count === 'number' ? s.survived_count : '-'} / {typeof s.dead_count === 'number' ? s.dead_count : '-'}</TableCell>
                        <TableCell>{getBatchCode(s.batch_id)}</TableCell>
                        <TableCell>{getZoneCode(s.zone_id)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingSeedling(s); setIsFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeletingSeedlingId(s.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSeedling ? "แก้ไข" : "เพิ่ม"}ข้อมูลต้นกล้า</DialogTitle>
          </DialogHeader>
          <SeedlingForm 
            batches={batches} zones={zones} 
            initialData={editingSeedling ? {
              species: editingSeedling.species,
              height_range: editingSeedling.height_range,
              count: editingSeedling.count,
              batch_id: String(editingSeedling.batch_id || ''),
              zone_id: String(editingSeedling.zone_id || ''),
              survived_count: editingSeedling.survived_count ?? 0,
              dead_count: editingSeedling.dead_count ?? 0,
            } : undefined}
            onSubmit={handleFormSubmit} 
            onClose={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Dialog for Delete Confirmation */}
      <AlertDialog open={deletingSeedlingId !== null} onOpenChange={() => setDeletingSeedlingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ?</AlertDialogTitle>
            <AlertDialogDescription>การกระทำนี้ไม่สามารถย้อนกลับได้ ข้อมูลต้นกล้านี้จะถูกลบออกจากระบบอย่างถาวร</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

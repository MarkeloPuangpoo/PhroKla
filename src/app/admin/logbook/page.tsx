"use client";
import { useEffect, useState, useCallback, FC } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Calendar, Hash, MapPin, BookText } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Type Definitions for better code safety ---
type Log = {
  id: number;
  log_date: string;
  activity: string;
  batch_id: number | null;
  zone_id: number | null;
  note: string | null;
};
type Batch = { id: number; batch_code: string };
type Zone = { id: number; zone_code: string };

const initialFormState = { log_date: "", activity: "", batch_id: "", zone_id: "", note: "" };

// --- Sub-component for the Log Form ---
const LogForm: FC<{
  batches: Batch[];
  zones: Zone[];
  onSubmit: (formData: typeof initialFormState) => Promise<void>;
  onClose: () => void;
}> = ({ batches, zones, onSubmit, onClose }) => {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: 'batch_id' | 'zone_id') => (value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.log_date || !form.activity) return;
    setIsSubmitting(true);
    await onSubmit(form);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input name="log_date" type="date" value={form.log_date} onChange={handleChange} required />
        <Input name="activity" placeholder="กิจกรรมหลัก" value={form.activity} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select name="batch_id" onValueChange={handleSelectChange('batch_id')}>
          <SelectTrigger><SelectValue placeholder="เลือกรุ่น (Batch)" /></SelectTrigger>
          <SelectContent>
            {batches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.batch_code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select name="zone_id" onValueChange={handleSelectChange('zone_id')}>
          <SelectTrigger><SelectValue placeholder="เลือกโซน (Zone)" /></SelectTrigger>
          <SelectContent>
            {zones.map(z => <SelectItem key={z.id} value={String(z.id)}>{z.zone_code}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Textarea name="note" placeholder="รายละเอียดเพิ่มเติม/หมายเหตุ (ถ้ามี)" value={form.note || ''} onChange={handleChange} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// --- Sub-component for Skeleton Loading UI ---
const TimelineSkeleton = () => (
  <div className="space-y-8">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex gap-4">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0 mt-1 animate-pulse"></div>
        <div className="flex-1 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-3/4 rounded-md bg-muted animate-pulse"></div>
              <div className="h-4 w-1/4 rounded-md bg-muted animate-pulse"></div>
            </div>
            <div className="h-8 w-full rounded-md bg-muted animate-pulse"></div>
            <div className="flex gap-4">
              <div className="h-4 w-1/3 rounded-md bg-muted animate-pulse"></div>
              <div className="h-4 w-1/3 rounded-md bg-muted animate-pulse"></div>
            </div>
        </div>
      </div>
    ))}
  </div>
);

// --- Main Page Component ---
export default function LogbookPage() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  const [logs, setLogs] = useState<Log[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [logsRes, batchesRes, zonesRes] = await Promise.all([
        supabase.from("nursery_logs").select("*").order("log_date", { ascending: false }).limit(50),
        supabase.from("batches").select("id,batch_code"),
        supabase.from("nursery_zones").select("id,zone_code"),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (batchesRes.error) throw batchesRes.error;
      if (zonesRes.error) throw zonesRes.error;

      setLogs(logsRes.data as Log[]);
      setBatches(batchesRes.data as Batch[]);
      setZones(zonesRes.data as Zone[]);

    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("ไม่สามารถโหลดข้อมูลได้: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddLog = async (formData: typeof initialFormState) => {
    const { error } = await supabase.from("nursery_logs").insert([
      {
        ...formData,
        batch_id: formData.batch_id ? Number(formData.batch_id) : null,
        zone_id: formData.zone_id ? Number(formData.zone_id) : null,
      }
    ]);

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      await fetchData(); // Refresh data
    }
  };
  
  const getBatchCode = (id: number | null) => batches.find(b => b.id === id)?.batch_code || '-';
  const getZoneCode = (id: number | null) => zones.find(z => z.id === id)?.zone_code || '-';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">สมุดบันทึกกิจกรรม</h1>
          <p className="text-muted-foreground">ประวัติการดูแลต้นกล้าในโรงเพาะชำ</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <PlusCircle className="h-5 w-5" />
              เพิ่มบันทึกใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">บันทึกกิจกรรมใหม่</DialogTitle>
            </DialogHeader>
            <LogForm batches={batches} zones={zones} onSubmit={handleAddLog} onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      {/* Timeline View */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>บันทึกล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TimelineSkeleton />
          ) : error ? (
             <div className="text-center text-destructive py-10">{error}</div>
          ) : logs.length > 0 ? (
            <div className="relative pl-8 before:absolute before:left-4 before:top-0 before:h-full before:w-px before:bg-border">
              <div className="space-y-10">
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-9 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <BookText className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                            <h3 className="font-semibold text-foreground">{log.activity}</h3>
                            <time className="text-xs sm:text-sm text-muted-foreground shrink-0 sm:ml-4">
                              {new Date(log.log_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </time>
                        </div>
                        {log.note && (
                          <p className="text-sm text-muted-foreground mb-3">{log.note}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs border-t pt-2 mt-2">
                            <span className="flex items-center gap-1.5"><Hash size={14} /> Batch: <span className="font-medium text-foreground">{getBatchCode(log.batch_id)}</span></span>
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> Zone: <span className="font-medium text-foreground">{getZoneCode(log.zone_id)}</span></span>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="text-center h-48 flex flex-col justify-center items-center text-muted-foreground">
              <p>ยังไม่มีบันทึกกิจกรรม...</p>
              <p>คลิก 'เพิ่มบันทึกใหม่' เพื่อเริ่มต้น</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

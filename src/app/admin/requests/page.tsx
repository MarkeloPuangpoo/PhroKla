"use client";
import { useEffect, useState, useRef, useCallback, FC, forwardRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, CheckCircle, Printer, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Type Definitions ---
type Seedling = { id: number; species: string; height_range: string; count: number };
type Partner = { id: number; name: string };
type Request = {
  id: number;
  request_date: string;
  partner_id: number;
  status: 'pending' | 'approved';
  note: string | null;
  seedling_request_items: { quantity: number, seedlings: Seedling }[];
};
const initialFormState = { partner_id: "", request_date: "", items: [{ seedling_id: "", quantity: 1 }], note: "" };

// --- Sub-component: Printable Delivery Note (Now handles its own printing) ---
const PrintableDeliveryNote: FC<{ request: Request; partnerName: string; onPrintCompleted: () => void; }> = ({ request, partnerName, onPrintCompleted }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    onAfterPrint: onPrintCompleted,
    documentTitle: `ใบส่งมอบ-${request.id}-${partnerName}`,
  });

  useEffect(() => {
    // Automatically trigger print when the component mounts
    handlePrint();
  }, [handlePrint]);

  return (
    <div ref={componentRef} className="p-8 font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold">ใบส่งมอบต้นกล้า</h1>
        <p>โครงการเพราะกล้า</p>
      </header>
      <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div><strong>ผู้รับ:</strong> {partnerName}</div>
        <div className="text-right"><strong>วันที่:</strong> {new Date(request.request_date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</div>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left font-semibold">รายการต้นกล้า</th>
            <th className="p-2 text-left font-semibold">ช่วงความสูง</th>
            <th className="p-2 text-right font-semibold">จำนวน (ต้น)</th>
          </tr>
        </thead>
        <tbody>
          {request.seedling_request_items.map((item, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-2">{item.seedlings.species}</td>
              <td className="p-2">{item.seedlings.height_range}</td>
              <td className="p-2 text-right">{item.quantity.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {request.note && <div className="mt-6 text-sm"><strong>หมายเหตุ:</strong> {request.note}</div>}
      <footer className="mt-24 text-sm">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="mt-12 border-t pt-2">ผู้ส่งมอบ</p>
          </div>
          <div>
            <p className="mt-12 border-t pt-2">ผู้รับมอบ</p>
          </div>
        </div>
      </footer>
    </div>
  );
};


// --- Sub-component: Request Form ---
const RequestForm: FC<{
  partners: Partner[]; seedlings: Seedling[];
  onSubmit: (form: typeof initialFormState) => Promise<void>; onClose: () => void;
}> = ({ partners, seedlings, onSubmit, onClose }) => {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleItemChange = (idx: number, key: 'seedling_id' | 'quantity', value: any) => {
    const newItems = form.items.map((item, i) => i === idx ? { ...item, [key]: value } : item);
    setForm(f => ({ ...f, items: newItems }));
  };
  const handleAddItem = () => setForm(f => ({ ...f, items: [...f.items, { seedling_id: "", quantity: 1 }] }));
  const handleRemoveItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(form);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select name="partner_id" required onValueChange={val => setForm(f => ({ ...f, partner_id: val }))}>
          <SelectTrigger><SelectValue placeholder="เลือกผู้รับ/เครือข่าย" /></SelectTrigger>
          <SelectContent>{partners.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input name="request_date" type="date" required value={form.request_date} onChange={e => setForm(f => ({ ...f, request_date: e.target.value }))} />
      </div>
      <div className="space-y-3 rounded-md border p-3">
        <h4 className="font-medium">รายการต้นกล้า</h4>
        {form.items.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center">
            <Select required onValueChange={val => handleItemChange(idx, 'seedling_id', val)}>
              <SelectTrigger><SelectValue placeholder="เลือกต้นกล้า" /></SelectTrigger>
              <SelectContent>{seedlings.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.species} ({s.height_range}) - คงเหลือ {s.count}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" min={1} max={seedlings.find(s => String(s.id) === item.seedling_id)?.count || 1} required value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))} className="w-full sm:w-28" />
            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)} disabled={form.items.length === 1}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1"><PlusCircle size={14} /> เพิ่มรายการ</Button>
      </div>
      <Textarea name="note" placeholder="หมายเหตุ (ถ้ามี)" value={form.note || ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก...</> : "สร้างใบคำขอ"}</Button>
      </DialogFooter>
    </form>
  );
};

function exportRequestsToCSV(requests: any[]) {
  if (!requests.length) return;
  const fields = Object.keys(requests[0]);
  const csv = [fields.join(",")].concat(
    requests.map(row => fields.map(f => `"${(row[f] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `requests_export_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// --- Main Page Component ---
export default function RequestsPage() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  const [requests, setRequests] = useState<Request[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [printData, setPrintData] = useState<Request | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqRes, ptnRes, sldRes] = await Promise.all([
        supabase.from("seedling_requests").select(`*, seedling_request_items(*, seedlings(*))`).order("request_date", { ascending: false }),
        supabase.from("partners").select("id,name"),
        supabase.from("seedlings").select("id,species,height_range,count")
      ]);
      if (reqRes.error) throw reqRes.error; if (ptnRes.error) throw ptnRes.error; if (sldRes.error) throw sldRes.error;
      setRequests(reqRes.data as Request[]); setPartners(ptnRes.data as Partner[]); setSeedlings(sldRes.data as Seedling[]);
    } catch (err: any) { setError("ไม่สามารถโหลดข้อมูลได้: " + err.message); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddRequest = async (form: typeof initialFormState) => {
    const { data: req, error: reqError } = await supabase.from("seedling_requests").insert([{ partner_id: Number(form.partner_id), request_date: form.request_date, note: form.note || null, status: "pending" }]).select().single();
    if (reqError) { alert("เกิดข้อผิดพลาด: " + reqError.message); return; }
    const itemsToInsert = form.items.map(item => ({ request_id: req.id, seedling_id: Number(item.seedling_id), quantity: Number(item.quantity) }));
    const { error: itemError } = await supabase.from("seedling_request_items").insert(itemsToInsert);
    if (itemError) { alert("เกิดข้อผิดพลาดในการเพิ่มรายการ: " + itemError.message); } else { await fetchData(); }
  };

  const handleApprove = async (request: Request) => {
    setActionLoading(prev => ({ ...prev, [request.id]: true }));
    for (const item of request.seedling_request_items) {
      const seedling = seedlings.find(s => s.id === item.seedlings.id);
      if (seedling && seedling.count >= item.quantity) {
        await supabase.from("seedlings").update({ count: seedling.count - item.quantity }).eq("id", item.seedlings.id);
      }
    }
    await supabase.from("seedling_requests").update({ status: "approved" }).eq("id", request.id);
    await fetchData();
    setActionLoading(prev => ({ ...prev, [request.id]: false }));
  };

  const getPartnerName = (id: number) => partners.find(p => p.id === id)?.name || '-';

  const renderStatusBadge = (status: 'pending' | 'approved') => (
    <Badge variant={status === 'approved' ? 'default' : 'secondary'} className={status === 'approved' ? "bg-green-500/80" : ""}>
      {status === 'pending' ? 'รออนุมัติ' : 'อนุมัติแล้ว'}
    </Badge>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ใบคำขอรับต้นกล้า</h1>
          <p className="text-muted-foreground">สร้างและจัดการใบคำขอ (Request Orders)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2 w-full sm:w-auto"><PlusCircle className="h-5 w-5" /> สร้างใบคำขอใหม่</Button></DialogTrigger>
          <DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle className="text-xl">สร้างใบคำขอใหม่</DialogTitle></DialogHeader>
            <RequestForm partners={partners} seedlings={seedlings} onSubmit={handleAddRequest} onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>
      
      {/* Content */}
      <Card className="shadow-md">
        <CardHeader><CardTitle>ประวัติใบคำขอ</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="text-center py-10">กำลังโหลด...</div> : error ? <div className="text-center text-destructive py-10">{error}</div> : requests.length === 0 ? (
            <div className="text-center h-48 flex flex-col justify-center items-center text-muted-foreground">
              <p>ยังไม่มีใบคำขอ...</p><p>คลิก 'สร้างใบคำขอใหม่' เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button variant="outline" onClick={() => exportRequestsToCSV(requests)}>
                  Export CSV
                </Button>
              </div>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {requests.map(req => (
                  <Card key={req.id} className="overflow-hidden">
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-primary">{getPartnerName(req.partner_id)}</span>
                        {renderStatusBadge(req.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{new Date(req.request_date).toLocaleDateString('th-TH', { dateStyle: 'long' })}</p>
                    </div>
                    <Accordion type="single" collapsible className="bg-muted/50">
                      <AccordionItem value="items">
                        <AccordionTrigger className="px-4 text-sm">ดูรายการ ({req.seedling_request_items.length})</AccordionTrigger>
                        <AccordionContent className="p-4 space-y-2 text-sm">
                          {req.seedling_request_items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>- {item.seedlings.species} ({item.seedlings.height_range})</span>
                              <span>x {item.quantity}</span>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <div className="p-4 flex justify-end gap-2">
                      {req.status === "pending" && <Button size="sm" onClick={() => handleApprove(req)} disabled={actionLoading[req.id]}>{actionLoading[req.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle size={16} />}<span className="ml-1">อนุมัติ</span></Button>}
                      {req.status === "approved" && <Button size="sm" variant="outline" onClick={() => setPrintData(req)}><Printer size={16} /><span className="ml-1">พิมพ์</span></Button>}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่</TableHead><TableHead>ผู้รับ</TableHead>
                      <TableHead>สถานะ</TableHead><TableHead>หมายเหตุ</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map(req => (
                      <TableRow key={req.id}>
                        <TableCell>{new Date(req.request_date).toLocaleDateString('th-TH')}</TableCell>
                        <TableCell className="font-medium">{getPartnerName(req.partner_id)}</TableCell>
                        <TableCell>{renderStatusBadge(req.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">{req.note || '-'}</TableCell>
                        <TableCell className="text-right">
                          {req.status === 'pending' && <Button size="sm" onClick={() => handleApprove(req)} disabled={actionLoading[req.id]}>{actionLoading[req.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}อนุมัติ/ตัดสต็อก</Button>}
                          {req.status === 'approved' && <Button size="sm" variant="outline" onClick={() => setPrintData(req)}>พิมพ์ใบส่งมอบ</Button>}
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
      
      {/* Hidden component for printing */}
      <div className="hidden">
        {printData && <PrintableDeliveryNote request={printData} partnerName={getPartnerName(printData.partner_id)} onPrintCompleted={() => setPrintData(null)} />}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState, useCallback, FC } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Building, Mail, MapPin, StickyNote, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Type Definition ---
type Partner = {
  id: number;
  name: string;
  contact: string | null;
  address: string | null;
  note: string | null;
};

const initialFormState = { name: "", contact: "", address: "", note: "" };

// --- Sub-component for the Partner Form ---
const PartnerForm: FC<{
  onSubmit: (formData: typeof initialFormState) => Promise<void>;
  onClose: () => void;
}> = ({ onSubmit, onClose }) => {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setIsSubmitting(true);
    await onSubmit(form);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <Input name="name" placeholder="ชื่อผู้รับ/หน่วยงาน" value={form.name} onChange={handleChange} required />
      <Input name="contact" placeholder="เบอร์ติดต่อ / อีเมล" value={form.contact || ''} onChange={handleChange} />
      <Input name="address" placeholder="ที่อยู่" value={form.address || ''} onChange={handleChange} />
      <Textarea name="note" placeholder="หมายเหตุ (ถ้ามี)" value={form.note || ''} onChange={handleChange} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// --- Sub-component for displaying a Partner as a Card on mobile ---
const PartnerCard: FC<{ partner: Partner }> = ({ partner }) => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
    <div className="font-semibold text-primary flex items-center gap-2">
      <Building className="h-5 w-5" />
      <span>{partner.name}</span>
    </div>
    <div className="border-b"></div>
    <div className="space-y-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        <span>{partner.contact || "-"}</span>
      </div>
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
        <p className="break-words">{partner.address || "-"}</p>
      </div>
       <div className="flex items-start gap-2">
        <StickyNote className="h-4 w-4 mt-0.5 shrink-0" />
        <p className="break-words">{partner.note || "-"}</p>
      </div>
    </div>
  </div>
);

// --- Sub-component for the Skeleton Loader ---
const SkeletonLoader = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-32 w-full animate-pulse rounded-md bg-muted" />
    ))}
  </div>
);

function exportPartnersToCSV(partners: any[]) {
  if (!partners.length) return;
  const fields = Object.keys(partners[0]);
  const csv = [fields.join(",")].concat(
    partners.map(row => fields.map(f => `"${(row[f] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `partners_export_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// --- Main Page Component ---
export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase.from("partners").select("*").order("name", { ascending: true });

    if (error) {
      console.error("Error fetching partners:", error);
      setError("ไม่สามารถโหลดข้อมูลได้");
    } else {
      setPartners(data as Partner[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAddPartner = async (formData: typeof initialFormState) => {
    const { error } = await supabase.from("partners").insert([{ ...formData }]);
    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      await fetchPartners();
    }
  };

  const renderContent = () => {
    if (isLoading) return <SkeletonLoader />;
    if (error) return <div className="text-center text-destructive py-10">{error}</div>;
    if (partners.length === 0) {
      return (
        <div className="text-center h-48 flex flex-col justify-center items-center text-muted-foreground">
          <p>ยังไม่มีข้อมูลผู้รับ/เครือข่าย...</p>
          <p>คลิก 'เพิ่มผู้รับใหม่' เพื่อเริ่มต้น</p>
        </div>
      );
    }
    
    return (
      <>
        {/* Mobile View: Cards (hidden on medium screens and up) */}
        <div className="md:hidden space-y-4">
          {partners.map(partner => <PartnerCard key={partner.id} partner={partner} />)}
        </div>

        {/* Desktop View: Table (hidden on small screens) */}
        <div className="hidden md:block border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Building className="inline h-4 w-4 mr-1" />ชื่อ</TableHead>
                <TableHead><Mail className="inline h-4 w-4 mr-1" />ติดต่อ</TableHead>
                <TableHead><MapPin className="inline h-4 w-4 mr-1" />ที่อยู่</TableHead>
                <TableHead><StickyNote className="inline h-4 w-4 mr-1" />หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map(partner => (
                <TableRow key={partner.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.contact || "-"}</TableCell>
                  <TableCell>{partner.address || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">{partner.note || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-2">
        <Button variant="outline" onClick={() => exportPartnersToCSV(partners)}>
          Export CSV
        </Button>
      </div>
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการผู้รับ/เครือข่าย</h1>
          <p className="text-muted-foreground">เพิ่มและดูข้อมูล Partner ของโครงการ</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <UserPlus className="h-5 w-5" />
              เพิ่มผู้รับใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">เพิ่มข้อมูลผู้รับ/เครือข่าย</DialogTitle>
            </DialogHeader>
            <PartnerForm onSubmit={handleAddPartner} onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      {/* Main Content Area */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>รายชื่อทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

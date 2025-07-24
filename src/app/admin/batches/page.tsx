"use client";
import { useEffect, useState, useCallback, FC } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, MapPin, Calendar, Hash, Globe, StickyNote } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const LeafletMapClient = dynamic(() => import("@/components/LeafletMapClient").then(mod => mod.LeafletMapClient), { ssr: false });
import type { MapMarker } from "@/components/LeafletMapClient";
import { WeatherWidget } from "@/components/WeatherWidget";

// --- Define a clear type for our data ---
type Batch = {
  id: number;
  batch_code: string;
  collected_at: string;
  source_name: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  note: string | null;
};

const initialFormState = {
  batch_code: "",
  collected_at: "",
  source_name: "",
  gps_latitude: "",
  gps_longitude: "",
  note: ""
};

// --- Sub-component for the Batch Form (No changes needed here) ---
const BatchForm: FC<{
  onSubmit: (formData: typeof initialFormState) => Promise<void>;
  onClose: () => void;
}> = ({ onSubmit, onClose }) => {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

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
        <Input name="batch_code" placeholder="รหัสรุ่น (Batch Code)" value={form.batch_code} onChange={handleChange} required />
        <Input name="collected_at" type="date" value={form.collected_at} onChange={handleChange} required />
      </div>
      <Input name="source_name" placeholder="ชื่อแหล่งที่มา (Source Name)" value={form.source_name} onChange={handleChange} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input name="gps_latitude" type="number" step="any" placeholder="Latitude" value={form.gps_latitude} onChange={handleChange} />
        <Input name="gps_longitude" type="number" step="any" placeholder="Longitude" value={form.gps_longitude} onChange={handleChange} />
      </div>
      <Input name="note" placeholder="หมายเหตุ (ถ้ามี)" value={form.note} onChange={handleChange} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// --- **NEW** Sub-component for displaying a batch as a Card on mobile ---
const BatchCard: FC<{ batch: Batch }> = ({ batch }) => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
    <div className="flex justify-between items-start">
      <div className="font-semibold text-primary">{batch.batch_code}</div>
      <div className="text-sm text-muted-foreground">
        {new Date(batch.collected_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
      </div>
    </div>
    <div className="border-b"></div>
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span>{batch.source_name || "-"}</span>
      </div>
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span>{batch.gps_latitude && batch.gps_longitude ? `${batch.gps_latitude.toFixed(4)}, ${batch.gps_longitude.toFixed(4)}` : "-"}</span>
      </div>
       <div className="flex items-start gap-2">
        <StickyNote className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <p className="break-words">{batch.note || "-"}</p>
      </div>
    </div>
  </div>
);


// --- Sub-component for the Skeleton Loader ---
const SkeletonLoader = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-24 w-full animate-pulse rounded-md bg-muted" />
    ))}
  </div>
);

function exportBatchesToCSV(batches: any[]) {
  if (!batches.length) return;
  const fields = Object.keys(batches[0]);
  const csv = [fields.join(",")].concat(
    batches.map(row => fields.map(f => `"${(row[f] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `batches_export_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// --- Main Page Component ---
export default function BatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.replace("/login");
      }
    });
  }, [router]);

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .order("collected_at", { ascending: false });

    if (error) {
      console.error("Error fetching batches:", error);
      setError("ไม่สามารถโหลดข้อมูลได้");
    } else {
      setBatches(data as Batch[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleAddBatch = async (formData: typeof initialFormState) => {
    const { error } = await supabase.from("batches").insert([
      {
        ...formData,
        gps_latitude: formData.gps_latitude ? Number(formData.gps_latitude) : null,
        gps_longitude: formData.gps_longitude ? Number(formData.gps_longitude) : null
      }
    ]);

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      await fetchBatches();
    }
  };

  const renderContent = () => {
    if (isLoading) return <SkeletonLoader />;
    if (error) return <div className="text-center text-destructive py-10">{error}</div>;
    if (batches.length === 0) {
      return (
        <div className="text-center h-48 flex flex-col justify-center items-center text-muted-foreground">
          <p>ยังไม่มีข้อมูลรุ่น...</p>
          <p>คลิก 'เพิ่มรุ่นใหม่' เพื่อเริ่มต้น</p>
        </div>
      );
    }
    
    return (
      <>
        {/* Mobile View: Cards (hidden on medium screens and up) */}
        <div className="md:hidden space-y-4">
          {batches.map(batch => <BatchCard key={batch.id} batch={batch} />)}
        </div>

        {/* Desktop View: Table (hidden on small screens) */}
        <div className="hidden md:block border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Hash className="inline h-4 w-4 mr-1" />รหัสรุ่น</TableHead>
                <TableHead><Calendar className="inline h-4 w-4 mr-1" />วันที่เก็บ</TableHead>
                <TableHead><MapPin className="inline h-4 w-4 mr-1" />แหล่งที่มา</TableHead>
                <TableHead><Globe className="inline h-4 w-4 mr-1" />พิกัด (Lat, Lng)</TableHead>
                <TableHead><StickyNote className="inline h-4 w-4 mr-1" />หมายเหตุ</TableHead>
                <TableHead>อากาศ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map(batch => (
                <TableRow key={batch.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{batch.batch_code}</TableCell>
                  <TableCell>{new Date(batch.collected_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                  <TableCell>{batch.source_name || "-"}</TableCell>
                  <TableCell>{batch.gps_latitude && batch.gps_longitude ? `${batch.gps_latitude.toFixed(4)}, ${batch.gps_longitude.toFixed(4)}` : "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">{batch.note || "-"}</TableCell>
                  <TableCell>
                    {batch.gps_latitude && batch.gps_longitude && process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ? (
                      <WeatherWidget lat={batch.gps_latitude} lng={batch.gps_longitude} apiKey={process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY} />
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  // สร้าง markers สำหรับ LeafletMap
  const mapMarkers: MapMarker[] = batches
    .filter(b => b.gps_latitude && b.gps_longitude)
    .map(b => ({ lat: b.gps_latitude!, lng: b.gps_longitude!, label: b.batch_code }));

  return (
    <div className="space-y-8">
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-2">แผนที่รุ่น (Batch Map)</h2>
        <LeafletMapClient
          markers={mapMarkers}
          height={400}
          zoom={7}
          center={mapMarkers.length ? mapMarkers[0] : { lat: 13.7563, lng: 100.5018 }}
        />
      </Card>
      <div className="flex justify-end mb-2">
        <Button variant="outline" onClick={() => exportBatchesToCSV(batches)}>
          Export CSV
        </Button>
      </div>
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการรุ่น/แหล่งที่มา</h1>
          <p className="text-muted-foreground">เพิ่มและดูข้อมูลรุ่นของต้นกล้าที่รวบรวมมา</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <PlusCircle className="h-5 w-5" />
              เพิ่มรุ่นใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">เพิ่มข้อมูลรุ่นใหม่</DialogTitle>
            </DialogHeader>
            <BatchForm onSubmit={handleAddBatch} onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </header>

      {/* Main Content Area */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>รายการทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

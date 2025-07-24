import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export type FilterCriteria = {
  species?: string[];
  height?: string[];
  batch?: string[];
  zone?: string[];
  dateFrom?: string;
  dateTo?: string;
};

export function FilterPanel({
  onFilter,
  speciesOptions = [],
  heightOptions = [],
  batchOptions = [],
  zoneOptions = [],
}: {
  onFilter: (criteria: FilterCriteria) => void;
  speciesOptions?: string[];
  heightOptions?: string[];
  batchOptions?: string[];
  zoneOptions?: string[];
}) {
  const [criteria, setCriteria] = useState<FilterCriteria>({});

  const handleMultiSelect = (name: keyof FilterCriteria, value: string) => {
    setCriteria(c => {
      const arr = c[name] ? [...(c[name] as string[])] : [];
      if (arr.includes(value)) {
        return { ...c, [name]: arr.filter(v => v !== value) };
      } else {
        return { ...c, [name]: [...arr, value] };
      }
    });
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCriteria(c => ({ ...c, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div>
        <div className="font-medium text-xs mb-1">ชนิดต้นไม้</div>
        <div className="flex flex-wrap gap-1">
          {speciesOptions.map(s => (
            <Button key={s} size="sm" variant={criteria.species?.includes(s) ? "default" : "outline"} onClick={() => handleMultiSelect("species", s)}>{s}</Button>
          ))}
        </div>
      </div>
      <div>
        <div className="font-medium text-xs mb-1">ช่วงความสูง</div>
        <div className="flex flex-wrap gap-1">
          {heightOptions.map(h => (
            <Button key={h} size="sm" variant={criteria.height?.includes(h) ? "default" : "outline"} onClick={() => handleMultiSelect("height", h)}>{h}</Button>
          ))}
        </div>
      </div>
      {batchOptions.length > 0 && (
        <div>
          <div className="font-medium text-xs mb-1">รุ่น (Batch)</div>
          <div className="flex flex-wrap gap-1">
            {batchOptions.map(b => (
              <Button key={b} size="sm" variant={criteria.batch?.includes(b) ? "default" : "outline"} onClick={() => handleMultiSelect("batch", b)}>{b}</Button>
            ))}
          </div>
        </div>
      )}
      {zoneOptions.length > 0 && (
        <div>
          <div className="font-medium text-xs mb-1">โซน (Zone)</div>
          <div className="flex flex-wrap gap-1">
            {zoneOptions.map(z => (
              <Button key={z} size="sm" variant={criteria.zone?.includes(z) ? "default" : "outline"} onClick={() => handleMultiSelect("zone", z)}>{z}</Button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="font-medium text-xs">ช่วงวันที่</div>
        <div className="flex gap-1">
          <Input name="dateFrom" type="date" value={criteria.dateFrom || ""} onChange={handleInput} className="w-32" />
          <Input name="dateTo" type="date" value={criteria.dateTo || ""} onChange={handleInput} className="w-32" />
        </div>
      </div>
      <Button onClick={() => onFilter(criteria)} className="h-10">กรองข้อมูล</Button>
    </div>
  );
} 
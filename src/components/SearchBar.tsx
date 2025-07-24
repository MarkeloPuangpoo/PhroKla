import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export type SearchQuery = {
  text: string;
  species?: string;
  height?: string;
  dateFrom?: string;
  dateTo?: string;
};

const quickFilters = [
  { label: "วันนี้", value: "today" },
  { label: "สัปดาห์นี้", value: "this_week" },
  { label: "เดือนนี้", value: "this_month" },
];

export function SearchBar({
  onSearch,
  onSaveQuery,
  savedQueries = [],
  speciesOptions = [],
  heightOptions = [],
}: {
  onSearch: (query: SearchQuery) => void;
  onSaveQuery?: (query: SearchQuery) => void;
  savedQueries?: { name: string; query: SearchQuery }[];
  speciesOptions?: string[];
  heightOptions?: string[];
}) {
  const [query, setQuery] = useState<SearchQuery>({ text: "" });
  const [savedName, setSavedName] = useState("");

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(q => ({ ...q, [e.target.name]: e.target.value }));
  };

  const handleSelect = (name: keyof SearchQuery) => (value: string) => {
    setQuery(q => ({ ...q, [name]: value }));
  };

  const handleQuickFilter = (filter: string) => {
    const now = new Date();
    let dateFrom = "", dateTo = "";
    if (filter === "today") {
      dateFrom = dateTo = now.toISOString().slice(0, 10);
    } else if (filter === "this_week") {
      const first = new Date(now.setDate(now.getDate() - now.getDay() + 1));
      const last = new Date(now.setDate(first.getDate() + 6));
      dateFrom = first.toISOString().slice(0, 10);
      dateTo = last.toISOString().slice(0, 10);
    } else if (filter === "this_month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFrom = first.toISOString().slice(0, 10);
      dateTo = last.toISOString().slice(0, 10);
    }
    setQuery(q => ({ ...q, dateFrom, dateTo }));
    onSearch({ ...query, dateFrom, dateTo });
  };

  return (
    <div className="flex flex-col md:flex-row gap-2 items-end md:items-center mb-4">
      <Input
        name="text"
        placeholder="ค้นหาทุกฟิลด์..."
        value={query.text}
        onChange={handleInput}
        className="w-full md:w-64"
      />
      <Select value={query.species || ""} onValueChange={handleSelect("species")}> 
        <SelectTrigger className="w-36"><SelectValue placeholder="ชนิดต้นไม้" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">ทั้งหมด</SelectItem>
          {speciesOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={query.height || ""} onValueChange={handleSelect("height")}> 
        <SelectTrigger className="w-36"><SelectValue placeholder="ช่วงความสูง" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">ทั้งหมด</SelectItem>
          {heightOptions.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        name="dateFrom"
        type="date"
        value={query.dateFrom || ""}
        onChange={handleInput}
        className="w-36"
        placeholder="จากวันที่"
      />
      <Input
        name="dateTo"
        type="date"
        value={query.dateTo || ""}
        onChange={handleInput}
        className="w-36"
        placeholder="ถึงวันที่"
      />
      <Button onClick={() => onSearch(query)} className="w-24">ค้นหา</Button>
      {onSaveQuery && (
        <div className="flex gap-1 items-center">
          <Input
            value={savedName}
            onChange={e => setSavedName(e.target.value)}
            placeholder="ชื่อคิวรี"
            className="w-28"
          />
          <Button
            variant="outline"
            onClick={() => { if (savedName) onSaveQuery({ ...query }); }}
            disabled={!savedName}
          >บันทึก</Button>
        </div>
      )}
      <div className="flex gap-1">
        {quickFilters.map(f => (
          <Button key={f.value} variant="ghost" onClick={() => handleQuickFilter(f.value)}>{f.label}</Button>
        ))}
      </div>
      {savedQueries.length > 0 && (
        <Select onValueChange={val => {
          const found = savedQueries.find(q => q.name === val);
          if (found) setQuery(found.query);
        }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="คิวรีที่บันทึกไว้" /></SelectTrigger>
          <SelectContent>
            {savedQueries.map(q => <SelectItem key={q.name} value={q.name}>{q.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 
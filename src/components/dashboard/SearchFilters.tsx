'use client';

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  statusOptions: { label: string; value: string }[];
  placeholder?: string;
}

export function SearchFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  placeholder = "Buscar...",
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="relative w-full md:w-[200px]">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="pl-9 appearance-none"
        >
          <option value="all">Todos os Status</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.subLabel && o.subLabel.toLowerCase().includes(search.toLowerCase())) ||
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 flex justify-between items-center cursor-pointer"
      >
        <span className={selected ? 'text-on-surface' : 'text-on-surface-variant'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className="text-on-surface-variant" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden max-h-60 flex flex-col">
          <div className="p-2 border-b border-outline-variant/10 flex items-center gap-2">
            <Search size={14} className="text-on-surface-variant" />
            <input 
              autoFocus
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
              placeholder="Search..."
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.length > 0 ? filtered.map(opt => (
              <div 
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  "px-4 py-2 text-sm cursor-pointer hover:bg-surface-container-low transition-colors",
                  value === opt.value ? "bg-primary/10 font-bold text-primary" : "text-on-surface"
                )}
              >
                <div>{opt.label}</div>
                {opt.subLabel && <div className="text-[10px] text-on-surface-variant">{opt.subLabel}</div>}
              </div>
            )) : (
              <div className="px-4 py-3 text-sm text-on-surface-variant text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

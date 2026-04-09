'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';

interface Item {
  id: string;
  name: string;
}

interface AutocompleteProps {
  label?: string;
  value: string;
  placeholder?: string;
  onSelect: (name: string, id: string) => void;
  onSearch: (query: string) => Promise<Item[]>;
  disabled?: boolean;
}

export function Autocomplete({ label, value, placeholder, onSelect, onSearch, disabled }: AutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    try {
      const items = await onSearch(val);
      setResults(items);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: Item) => {
    setQuery(item.name);
    setIsOpen(false);
    onSelect(item.name, item.id);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    onSelect('', '');
  };

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      {label && <label className="text-[9px] font-bold text-text-secondary px-1">{label}</label>}
      <div className="relative">
        <input
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          disabled={disabled}
          className={`w-full bg-bg-secondary border-2 border-black p-3 pr-10 text-text-primary outline-none focus:border-accent-primary transition-colors text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-accent-primary" />
          ) : query ? (
            <button type="button" onClick={clear} className="text-text-secondary hover:text-black">
              <X size={16} />
            </button>
          ) : (
            <Search size={16} className="text-text-secondary" />
          )}
        </div>
      </div>

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-48 overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="p-3 text-xs text-text-secondary italic">Buscando...</div>
          ) : (
            results.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left p-3 text-xs border-b border-black/10 last:border-none hover:bg-accent-primary/10 transition-colors uppercase font-bold"
              >
                {item.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Escola } from '../../types';
import { School as SchoolIcon, ChevronDown } from 'lucide-react';

interface SearchableSchoolSelectProps {
  escolas: Escola[];
  selectedId: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  inputClassName?: string;
}

export const SearchableSchoolSelect: React.FC<SearchableSchoolSelectProps> = ({
  escolas,
  selectedId,
  onChange,
  placeholder = "Buscar escola...",
  disabled = false,
  showAllOption = false,
  allOptionLabel = "Todas Unidades",
  className = "",
  inputClassName = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort schools alphabetically by name
  const sortedEscolas = React.useMemo(() => {
    return [...escolas].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [escolas]);

  // Find currently selected school name
  const selectedSchoolName = React.useMemo(() => {
    if (showAllOption && selectedId === 'ALL') {
      return allOptionLabel;
    }
    const found = escolas.find(e => e.id === selectedId);
    return found ? found.nome : '';
  }, [escolas, selectedId, showAllOption, allOptionLabel]);

  // Sync search input with selection name when dropdown is closed or selection changes
  useEffect(() => {
    if (!isOpen) {
      setSearch(selectedSchoolName);
    }
  }, [selectedSchoolName, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search text
  const filteredEscolas = React.useMemo(() => {
    if (!search || search === selectedSchoolName) {
      return sortedEscolas;
    }
    return sortedEscolas.filter(e =>
      e.nome.toLowerCase().includes(search.toLowerCase())
    );
  }, [sortedEscolas, search, selectedSchoolName]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onChange(showAllOption ? 'ALL' : '');
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange/20 outline-none transition-all text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 font-medium ${inputClassName}`}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {showAllOption && (
            <button
              type="button"
              onClick={() => {
                onChange('ALL');
                setSearch(allOptionLabel);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-all hover:bg-slate-50 ${selectedId === 'ALL' ? 'bg-orange-50/50 text-orange-600 font-bold' : 'text-slate-700'}`}
            >
              {allOptionLabel}
            </button>
          )}
          {filteredEscolas.map(e => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                onChange(e.id);
                setSearch(e.nome);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-all hover:bg-slate-50 ${e.id === selectedId ? 'bg-orange-50/50 text-orange-600 font-bold' : 'text-slate-700'}`}
            >
              {e.nome}
            </button>
          ))}
          {filteredEscolas.length === 0 && (!showAllOption || search !== '') && (
            <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
              Nenhuma escola encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
};

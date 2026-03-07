"use client";
import React, { useState, useRef, useMemo } from 'react';
import { Search, Check } from 'lucide-react';

export interface DropdownOption {
    id: string;
    label: string;
    subLabel?: string;
    avatar?: string;
}

interface VirtualMultiSelectProps {
    options: DropdownOption[];
    selectedIds: string[];
    onChange: (id: string) => void;
    placeholder?: string;
    itemHeight?: number;
    maxHeight?: number;
}

export function VirtualMultiSelect({
    options,
    selectedIds,
    onChange,
    placeholder = "البحث...",
    itemHeight = 64, // Default tall enough for avatar and two lines of text
    maxHeight = 320
}: VirtualMultiSelectProps) {
    const [search, setSearch] = useState('');
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase()) ||
            (opt.subLabel && opt.subLabel.toLowerCase().includes(search.toLowerCase()))
        );
    }, [options, search]);

    const totalHeight = filteredOptions.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
    const endIndex = Math.min(
        filteredOptions.length - 1,
        Math.floor((scrollTop + maxHeight) / itemHeight) + 2
    );

    const visibleOptions = filteredOptions.slice(startIndex, endIndex + 1);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    return (
        <div className="flex flex-col border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
            {/* Search Header */}
            <div className="flex items-center p-3 md:p-4 border-b border-gray-100 bg-gray-50/50">
                <Search className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent border-none outline-none text-xs md:text-sm text-gray-700 placeholder:text-gray-400 font-medium"
                />
            </div>

            {/* Virtualized List Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="overflow-y-auto custom-scrollbar relative bg-white"
                style={{ maxHeight: `${maxHeight}px` }}
            >
                <div style={{ height: `${totalHeight}px`, width: '100%' }}>
                    {visibleOptions.map((opt, idx) => {
                        const actualIndex = startIndex + idx;
                        const isSelected = selectedIds.includes(opt.id);

                        return (
                            <div
                                key={opt.id}
                                onClick={() => onChange(opt.id)}
                                className={`absolute w-full px-4 py-0 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50/50 ${isSelected ? 'bg-blue-50/30' : ''}`}
                                style={{ top: 0, transform: `translateY(${actualIndex * itemHeight}px)`, height: `${itemHeight}px` }}
                            >
                                <div className={`w-4 h-4 md:w-5 md:h-5 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected ? 'bg-[#102550] border-[#102550]' : 'border-gray-300 bg-white'}`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>

                                {opt.avatar && (
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 text-[#102550] flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                                        {opt.avatar}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 line-clamp-1 text-xs md:text-sm">{opt.label}</p>
                                    {opt.subLabel && <p className="text-gray-500 text-[10px] md:text-xs font-medium line-clamp-1">{opt.subLabel}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredOptions.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-xs md:text-sm p-8 text-center bg-gray-50/30">
                        <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-300 mb-2 opacity-50" />
                        لا توجد نتائج مطابقة لبحثك
                    </div>
                )}
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-[10px] md:text-xs font-bold text-gray-500 flex justify-between items-center">
                <span>تم تحديد {selectedIds.length} عنصر</span>
                {selectedIds.length > 0 && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange('CLEAR_ALL'); }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                    >
                        إلغاء التحديد
                    </button>
                )}
            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderKanban, Wallet, Link as LinkIcon, HeadphonesIcon, Settings, X, ChevronRight, User, FileText, ShoppingBag, Loader2, History, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { globalSearch, SearchResult } from '@/app/actions/search';

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim() || !text) return <span>{text}</span>;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = String(text).split(new RegExp(`(${escapedHighlight})`, 'gi'));

    return (
        <span>
            {parts.map((part, i) =>
                new RegExp(`^${escapedHighlight}$`, 'i').test(part)
                    ? <span key={i} className="text-[#7F56D9] bg-purple-100/50 font-bold px-0.5 rounded-sm">{part}</span>
                    : <span key={i}>{part}</span>
            )}
        </span>
    );
};

const navigationPages = [
    { id: 'nav-1', name: 'الرئيسية (لوحة التحكم)', icon: <FolderKanban className="w-5 h-5 text-gray-500" />, url: '/', type: 'page' },
    { id: 'nav-2', name: 'المشاريع', icon: <FolderKanban className="w-5 h-5 text-[#7F56D9]" />, url: '/projects', type: 'page' },
    { id: 'nav-3', name: 'المالية (العهد)', icon: <Wallet className="w-5 h-5 text-emerald-500" />, url: '/finances', type: 'page' },
    { id: 'nav-4', name: 'الروابط الهامة', icon: <LinkIcon className="w-5 h-5 text-blue-500" />, url: '/links', type: 'page' },
    { id: 'nav-5', name: 'الدعم الفني', icon: <HeadphonesIcon className="w-5 h-5 text-orange-500" />, url: '/support', type: 'page' },
    { id: 'nav-6', name: 'الإعدادات', icon: <Settings className="w-5 h-5 text-gray-600" />, url: '/settings', type: 'page' },
];

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isPending, startTransition] = useTransition();
    const [dbResults, setDbResults] = useState<SearchResult[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('recentSearches');
        if (stored) {
            try { setRecentSearches(JSON.parse(stored)); } catch (e) { console.error(e); }
        }
    }, []);

    const saveRecentSearch = React.useCallback((term: string) => {
        if (!term.trim()) return;
        setRecentSearches(prev => {
            const updated = [term.trim(), ...prev.filter(s => s !== term.trim())].slice(0, 5);
            localStorage.setItem('recentSearches', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    // 1. Filter static pages
    const filteredPages = query === ''
        ? navigationPages
        : navigationPages.filter((page) =>
            page.name.toLowerCase().includes(query.toLowerCase())
        );

    // 2. Fetch from DB
    useEffect(() => {
        const fetchResults = async () => {
            setSearchError(null);
            if (query.trim().length >= 2) {
                startTransition(async () => {
                    const response = await globalSearch(query.trim());
                    if (response.error) {
                        setSearchError(response.error);
                        setDbResults([]);
                    } else {
                        setDbResults(response.data || []);
                    }
                });
            } else {
                setDbResults([]);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query]);


    // 3. Combine Results
    const allResults = React.useMemo(() => [
        ...filteredPages.map(p => ({ ...p, isDb: false })),
        ...dbResults.map(r => ({
            id: r.id,
            name: r.title,
            description: r.description,
            url: r.url,
            type: r.type,
            isDb: true
        }))
    ], [filteredPages, dbResults]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setDbResults([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || allResults.length === 0) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % allResults.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (allResults[selectedIndex]) {
                    saveRecentSearch(query);
                    router.push(allResults[selectedIndex].url);
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, allResults, selectedIndex, router, onClose, query, saveRecentSearch]);

    const getIconForType = (type: string) => {
        switch (type) {
            case 'project': return <FolderKanban className="w-5 h-5 text-indigo-500" />;
            case 'invoice': return <FileText className="w-5 h-5 text-emerald-500" />;
            case 'purchase': return <ShoppingBag className="w-5 h-5 text-orange-500" />;
            case 'user': return <User className="w-5 h-5 text-blue-500" />;
            default: return <FolderKanban className="w-5 h-5 text-gray-500" />; // Should be overridden by static pages
        }
    };

    const getCategoryName = (type: string) => {
        switch (type) {
            case 'project': return 'المشاريع (قاعدة البيانات)';
            case 'invoice': return 'الفواتير (قاعدة البيانات)';
            case 'purchase': return 'المشتريات (قاعدة البيانات)';
            case 'user': return 'المستخدمين (قاعدة البيانات)';
            case 'page': return 'صفحات النظام';
            default: return 'نتائج أخرى';
        }
    }

    // Group results by category to render section headers
    const groupedResults = allResults.reduce((acc, result) => {
        const cat = result.type;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(result);
        return acc;
    }, {} as Record<string, typeof allResults>);

    let globalIndex = 0; // Keep track of physical index for keyboard nav

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-gray-100 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Search Header */}
                            <div className="flex items-center px-4 py-3 border-b border-gray-100 relative">
                                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="flex-1 px-3 py-2 text-base text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
                                    placeholder="ابحث عن صفحة، مشروع، مستخدم، أو فاتورة..."
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setSelectedIndex(0);
                                    }}
                                />
                                {isPending && (
                                    <Loader2 className="w-5 h-5 text-[#7F56D9] animate-spin absolute end-12" />
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-md transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Results */}
                            <div className="max-h-[60vh] overflow-y-auto p-2">
                                {allResults.length > 0 ? (
                                    <div className="space-y-4">
                                        {Object.entries(groupedResults).map(([category, items]) => {
                                            if (items.length === 0) return null;
                                            return (
                                                <div key={category} className="space-y-1">
                                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                        {getCategoryName(category)}
                                                    </div>
                                                    {items.map((result) => {
                                                        const currentIndex = globalIndex++;
                                                        return (
                                                            <div
                                                                key={result.id}
                                                                className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${selectedIndex === currentIndex
                                                                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 ring-1 ring-gray-200/50'
                                                                    : 'hover:bg-gray-50'
                                                                    }`}
                                                                onClick={() => {
                                                                    saveRecentSearch(query);
                                                                    router.push(result.url);
                                                                    onClose();
                                                                }}
                                                                onMouseEnter={() => setSelectedIndex(currentIndex)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-lg ${selectedIndex === currentIndex ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                                                                        {result.isDb ? getIconForType(result.type) : ('icon' in result ? (result.icon as React.ReactNode) : getIconForType(result.type))}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className={`font-medium ${selectedIndex === currentIndex ? 'text-gray-900' : 'text-gray-600'}`}>
                                                                            <HighlightText text={result.name} highlight={query} />
                                                                        </span>
                                                                        {'isDb' in result && result.isDb && 'description' in result && result.description && (
                                                                            <span className="text-xs text-gray-500 mt-0.5 max-w-[300px] truncate">
                                                                                <HighlightText text={String(result.description)} highlight={query} />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {selectedIndex === currentIndex && (
                                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-12 px-6 text-center">
                                        {isPending ? (
                                            <>
                                                <Loader2 className="mx-auto h-10 w-10 text-[#7F56D9] animate-spin" />
                                                <h3 className="mt-4 text-sm font-semibold text-gray-900">جاري البحث...</h3>
                                            </>
                                        ) : searchError ? (
                                            <>
                                                <AlertCircle className="mx-auto h-12 w-12 text-red-300" />
                                                <h3 className="mt-4 text-sm font-semibold text-red-900">خطأ في البحث</h3>
                                                <p className="mt-1 text-sm text-red-500">{searchError}</p>
                                            </>
                                        ) : (
                                            <>
                                                <FolderKanban className="mx-auto h-12 w-12 text-gray-300" />
                                                <h3 className="mt-4 text-sm font-semibold text-gray-900">لم يتم العثور على نتائج</h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    يرجى التأكد من الكلمة المدخلة والمحاولةمرة أخرى. البحث يبدأ بعد حرفين.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Recent Searches */}
                                {query === '' && recentSearches.length > 0 && (
                                    <div className="mt-3 px-3 border-t border-gray-100 pt-3">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                <History className="w-4 h-4" />
                                                عمليات بحث سابقة
                                            </div>
                                            <button
                                                onClick={clearRecentSearches}
                                                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                مسح
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {recentSearches.map((term, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        setQuery(term);
                                                        inputRef.current?.focus();
                                                    }}
                                                    className="px-3 py-1.5 bg-gray-50 hover:bg-purple-50 hover:text-[#7F56D9] text-gray-600 hover:border-purple-200 text-sm rounded-full transition-colors border border-gray-100 shadow-sm"
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer hint */}
                            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">Enter</kbd> للإختيار
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">↑</kbd>
                                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">↓</kbd> للتنقل
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">Esc</kbd> للإغلاق
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

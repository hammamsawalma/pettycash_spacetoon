"use client";

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X, UploadCloud, FileType } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from "@/context/LanguageContext";

interface FileUploadProps {
    name: string;
    accept?: string;
    maxSizeMB?: number;
    placeholder?: string;
    description?: string;
    previewUrl?: string | null;
    onChange?: (file: File | null) => void;
    variant?: 'avatar' | 'document';
    /** If true, directly opens the device camera on mobile (#54) */
    capture?: boolean | 'user' | 'environment';
    /** Max dimension for client-side image compression in pixels (#98) */
    maxImageDimension?: number;
}

export function FileUpload({
    name,
    accept = "image/png, image/jpeg, application/pdf",
    maxSizeMB = 5,
    placeholder = "اضغط لرفع ملف",
    description = "أو اسحب واسقط الملف هنا",
    previewUrl = null,
    onChange,
    variant = 'document',
    capture,
    maxImageDimension = 1920,
}: FileUploadProps) {
    const { locale } = useLanguage();
    const displayPlaceholder = placeholder || (locale === 'ar' ? 'اضغط لرفع ملف' : 'Click to upload');
    const displayDescription = description || (locale === 'ar' ? 'أو اسحب واسقط الملف هنا' : 'Or drag and drop here');
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(previewUrl);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
            // Prevent folder drops
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file' && typeof items[i].webkitGetAsEntry === 'function') {
                    const entry = items[i].webkitGetAsEntry();
                    if (entry && entry.isDirectory) {
                        setError(locale === 'ar' ? "لا يمكن رفع المجلدات. يرجى اختيار ملفات فقط." : "Folders cannot be uploaded. Please select files only.");
                        return;
                    }
                }
            }
        }

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (selectedFile: File) => {
        setError(null);

        // Validate Size
        if (selectedFile.size > maxSizeMB * 1024 * 1024) {
            setError(locale === 'ar' ? `حجم الملف يجب أن لا يتجاوز ${maxSizeMB} ميجابايت` : `File size must not exceed ${maxSizeMB} MB`);
            return;
        }

        // Validate empty files or folders dragged directly
        if (selectedFile.size === 0 || selectedFile.type === "") {
            setError(locale === 'ar' ? "ملف غير صالح أو المجلدات غير مدعومة." : "Invalid file or folders not supported.");
            return;
        }

        // Validate Type if specific accept passed (basic check)
        if (accept && accept !== "*") {
            const acceptedTypes = accept.split(',').map(t => t.trim());
            const fileType = selectedFile.type;
            const isAccepted = acceptedTypes.some(type => {
                if (type.endsWith('/*')) {
                    return fileType.startsWith(type.replace('/*', ''));
                }
                return fileType === type;
            });

            if (!isAccepted) {
                setError(locale === 'ar' ? `نوع الملف غير مدعوم. الأنواع المدعومة: ${accept}` : `Unsupported file type. Accepted: ${accept}`);
                return;
            }
        }

        // Client-side image compression (#98)
        if (selectedFile.type.startsWith('image/') && maxImageDimension > 0) {
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(selectedFile);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const { width, height } = img;
                const needsResize = width > maxImageDimension || height > maxImageDimension;

                if (!needsResize) {
                    // No compression needed — use original
                    finalizeFile(selectedFile);
                    return;
                }

                const scale = Math.min(maxImageDimension / width, maxImageDimension / height);
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(width * scale);
                canvas.height = Math.round(height * scale);
                const ctx = canvas.getContext('2d');
                if (!ctx) { finalizeFile(selectedFile); return; }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (!blob) { finalizeFile(selectedFile); return; }
                    const compressed = new File([blob], selectedFile.name, {
                        type: selectedFile.type,
                        lastModified: Date.now(),
                    });
                    finalizeFile(compressed);
                }, selectedFile.type, 0.82); // 82% quality
            };
            img.onerror = () => finalizeFile(selectedFile);
            img.src = objectUrl;
        } else {
            finalizeFile(selectedFile);
        }
    };

    const finalizeFile = (processedFile: File) => {
        setFile(processedFile);
        if (onChange) onChange(processedFile);

        // Preview for Images
        if (processedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(processedFile);
        } else {
            setPreview(null);
        }
    };

    const removeFile = (e: React.MouseEvent) => {
        e.preventDefault();
        setFile(null);
        setPreview(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = "";
        if (onChange) onChange(null);
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    const isImagePreview = preview || (file && file.type.startsWith('image/'));

    return (
        <div className="w-full">
            <input
                ref={inputRef}
                type="file"
                name={name}
                accept={accept}
                capture={capture}
                onChange={handleChange}
                aria-label={placeholder}
                className="hidden"
            />

            <div
                className={`
                    relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out
                    ${dragActive ? 'border-[#102550] bg-[#102550]/5 scale-[1.02]' : 'border-gray-200 bg-white hover:border-[#102550]/50 hover:bg-gray-50'}
                    ${error ? 'border-red-400 bg-red-50' : ''}
                    ${variant === 'avatar' ? 'py-6 px-4 flex flex-col items-center justify-center min-h-[160px]' : 'px-6 py-8 md:py-10'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
            >
                {/* Error State */}
                {error && (
                    <div className="absolute top-2 end-2 start-2 bg-red-100 text-red-600 text-[10px] md:text-xs font-bold py-1 px-3 rounded-lg text-center z-10 shadow-sm animate-pulse">
                        {error}
                    </div>
                )}

                {/* File Selected State */}
                {file || preview ? (
                    <div className="relative group w-full flex flex-col items-center justify-center">
                        {isImagePreview && preview ? (
                            <div className={`relative overflow-hidden shadow-sm ${variant === 'avatar' ? 'w-24 h-24 rounded-full ring-4 ring-white' : 'w-full aspect-[4/3] max-h-48 rounded-xl'}`}>
                                <Image
                                    src={preview}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer">
                                    <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg drop-shadow-md">
                                        {locale === 'ar' ? 'تغيير الصورة' : 'Change Image'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-gray-50 w-full rounded-xl border border-gray-100 group-hover:bg-[#102550]/5 transition-colors">
                                <FileType className="w-10 h-10 text-[#102550]" />
                                <div className="text-center w-full">
                                    <p className="text-sm font-bold text-gray-900 truncate px-4">{file?.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{(file?.size ? (file.size / 1024 / 1024).toFixed(2) : 0)} MB</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={removeFile}
                            className={`absolute -top-3 -end-3 md:-end-4 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full p-1.5 shadow-sm transition-all focus:outline-none z-20 ${variant === 'avatar' ? 'top-0 end-1/4 rtl:-translate-x-1/2 translate-x-1/2' : ''}`}
                            title={locale === 'ar' ? "إزالة" : "Remove"}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    /* Initial Empty State */
                    <div className="text-center group w-full cursor-pointer flex flex-col items-center justify-center">
                        <div className={`rounded-full bg-gray-50 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#102550]/10 ${variant === 'avatar' ? 'p-4' : 'p-3'}`}>
                            {variant === 'avatar' ? (
                                <ImageIcon className="h-8 w-8 md:h-10 md:w-10 text-gray-400 group-hover:text-[#102550] transition-colors" aria-hidden="true" />
                            ) : (
                                <UploadCloud className="h-8 w-8 md:h-10 md:w-10 text-gray-400 group-hover:text-[#102550] transition-colors" aria-hidden="true" />
                            )}
                        </div>
                        <div className="flex flex-col md:flex-row items-center justify-center text-xs md:text-sm leading-6 text-gray-600 group-hover:text-gray-900 transition-colors">
                            <span className="relative font-bold text-[#102550] px-1 md:px-2">
                                {displayPlaceholder}
                            </span>
                            <p className="hidden md:block font-medium">{displayDescription}</p>
                        </div>
                        <p className="text-[10px] md:text-xs leading-5 text-gray-400 mt-2 font-medium">
                            {accept.includes('pdf') ? 'PDF, PNG, JPG' : 'PNG, JPG'} {locale === 'ar' ? `حتى ${maxSizeMB} ميجابايت` : `up to ${maxSizeMB} MB`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

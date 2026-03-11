"use client"
import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "./Button";
import { Eraser, Save, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    savedSignature?: string | null;
    width?: number;
    height?: number;
    label?: string;
}

export function SignaturePad({ onSave, savedSignature, width = 400, height = 200, label }: SignaturePadProps) {
    const { locale } = useLanguage();
    const displayLabel = label || (locale === 'ar' ? 'التوقيع' : 'Signature');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    const getContext = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        return ctx;
    }, []);

    // Initialize canvas
    useEffect(() => {
        const ctx = getContext();
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#1a1a2e";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }, [width, height, getContext]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ("touches" in e) {
            const touch = e.touches[0];
            return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const ctx = getContext();
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasDrawn(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        const ctx = getContext();
        if (!ctx) return;
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clear = () => {
        const ctx = getContext();
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#1a1a2e";
        setHasDrawn(false);
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        onSave(dataUrl);
    };

    const useSaved = () => {
        if (!savedSignature) return;
        onSave(savedSignature);
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 block">{displayLabel}</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white" style={{ maxWidth: width }}>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={clear} className="gap-1.5 text-sm px-3 py-2">
                    <Eraser className="w-4 h-4" /> {locale === 'ar' ? 'مسح' : 'Clear'}
                </Button>
                {hasDrawn && (
                    <Button type="button" variant="primary" onClick={save} className="gap-1.5 text-sm px-4 py-2 bg-green-600 hover:bg-green-700 border-green-700">
                        <Save className="w-4 h-4" /> {locale === 'ar' ? 'تأكيد التوقيع' : 'Confirm Signature'}
                    </Button>
                )}
                {savedSignature && (
                    <Button type="button" variant="outline" onClick={useSaved} className="gap-1.5 text-sm px-3 py-2 text-blue-600 border-blue-200">
                        <RotateCcw className="w-4 h-4" /> {locale === 'ar' ? 'استخدام المحفوظ' : 'Use Saved'}
                    </Button>
                )}
            </div>
        </div>
    );
}

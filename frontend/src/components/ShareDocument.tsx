import { useState, useRef, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, ShieldCheck, Upload, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareDocumentProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
}

export default function ShareDocument({ isOpen, onClose, userEmail }: ShareDocumentProps) {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [files, setFiles] = useState<File[]>([]);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // The Live Proxy URL (Hidden from UI)
    const PROXY_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbySHhtyYndiEv9kcWM3YmlQrhNxJCzetgQqdlyOAFlp2kPDeRaF7yoYGWtbqKHdZeHO/exec";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        if (selected.length > 0) {
            setFiles(selected.slice(0, 2)); // Limit to 2
            setStatus('idle');
            setProgress(0);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleRealUpload = async () => {
        if (files.length === 0) return;
        setStatus('uploading');
        setProgress(10); // Start progress

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const base64 = await fileToBase64(file);
                
                // Realistic progress increment per file
                setProgress(20 + (i * 40)); 

                const response = await fetch(PROXY_WEB_APP_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Standard for Apps Script Web Apps when simple
                    body: JSON.stringify({
                        fileName: `[VAULT]_${file.name}`,
                        contentType: file.type,
                        base64: base64,
                        user: userEmail
                    })
                });

                // Since we use no-cors, we can't reliably read the body, 
                // but we assume success if the fetch doesn't throw.
                setProgress(60 + (i * 40));
            }
            
            setProgress(100);
            setTimeout(() => {
                setStatus('success');
                setFiles([]);
            }, 500);

        } catch (err) {
            console.error("Upload Error:", err);
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Share Document</h3>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Community Files</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Help the Community</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Have a document GridMind doesn't know yet? Share it here to improve intelligence for everyone. <strong>Note:</strong> Please ensure your upload complies with copyright laws.
                                </p>
                            </div>

                            {status === 'success' ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center py-8 text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1">Transmission Complete</h4>
                                    <p className="text-xs text-slate-600">Documents have been shared successfully!</p>
                                    <button 
                                        onClick={onClose}
                                        className="mt-6 px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                                    >
                                        Close
                                    </button>
                                </motion.div>
                            ) : status === 'uploading' ? (
                                <div className="py-10 space-y-6">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative w-16 h-16">
                                            <Loader2 className="w-full h-full text-blue-600 animate-spin opacity-20" />
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-600 text-xs">
                                                {Math.round(progress)}%
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-800">Sending Document...</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Transmitting for Review</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Upload Area */}
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
                                    >
                                        <div className="p-4 bg-slate-100 rounded-full text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all shadow-sm">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-slate-800">
                                                {files.length > 0 ? `${files.length} file selected` : "Select Reference File"}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1">PDF or image (Max 2 files)</p>
                                        </div>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden" 
                                            multiple
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={onClose}
                                            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all font-sans"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleRealUpload}
                                            disabled={files.length === 0}
                                            className="flex-1 px-4 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2 border border-blue-700"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            Share Document
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Disclaimer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest opacity-80">
                                IMPORTANT: Ensure you have legal rights to share these files. Unofficial reference only.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

"use client";

import { BrainCircuit } from "lucide-react";

export default function AnimatedLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-20 h-20 rounded-2xl border border-indigo-200 bg-indigo-50 flex items-center justify-center">
        <BrainCircuit className="w-10 h-10 text-indigo-600" />
      </div>
    </div>
  );
}

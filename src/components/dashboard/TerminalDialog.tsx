'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal as TerminalIcon, X, AlertTriangle } from "lucide-react";

// Importação dinâmica para evitar erros de SSR com XTerm.js
const TerminalContent = dynamic(() => import('./TerminalContent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      Inicializando terminal...
    </div>
  )
});

interface TerminalDialogProps {
  containerId: string;
  containerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TerminalDialog({
  containerId,
  containerName,
  open,
  onOpenChange,
}: TerminalDialogProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[70vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800">
        <DialogHeader className="p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TerminalIcon className="h-5 w-5 text-primary" />
              <DialogTitle className="text-zinc-100">Console: {containerName}</DialogTitle>
            </div>
            <div className="flex items-center gap-2 bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="text-[10px] uppercase font-bold text-destructive tracking-widest">Acesso Restrito</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-2 bg-black overflow-hidden relative">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
              <X className="h-12 w-12 text-destructive/50" />
              <p>{error}</p>
              <Button variant="outline" onClick={() => setError(null)}>Tentar Novamente</Button>
            </div>
          ) : open && (
            <TerminalContent 
              containerId={containerId} 
              containerName={containerName} 
              onError={setError} 
            />
          )}
        </div>
        
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center px-6">
          <p className="text-[10px] text-zinc-500 font-mono italic">
            Comandos executados como root no shell /bin/sh
          </p>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
            Encerrar Sessão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProjectLogs } from "@/lib/hooks/use-api";
import { RefreshCw, FileCode, Download, Info } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ProjectLogViewerDialogProps {
  projectPath: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectLogViewerDialog({
  projectPath,
  projectName,
  open,
  onOpenChange,
}: ProjectLogViewerDialogProps) {
  const [tail, setTail] = useState(200);
  const { data, isLoading, refetch, isFetching } = useProjectLogs(projectPath, tail, open);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.logs]);

  const handleDownload = () => {
    if (!data?.logs) return;
    const blob = new Blob([data.logs], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}-compose-logs.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800">
        <DialogHeader className="p-6 pb-2 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl text-zinc-100">Logs do Projeto: {projectName}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()} 
                disabled={isFetching}
                className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </div>
          <DialogDescription className="text-zinc-400">
            Exibindo logs agregados de todos os serviços do docker-compose.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 bg-black m-4 rounded-lg border border-zinc-800 overflow-hidden flex flex-col shadow-2xl">
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed" ref={scrollRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full gap-2 text-zinc-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Carregando logs do compose...
              </div>
            ) : data?.logs ? (
              data.logs
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                <Info className="h-8 w-8 opacity-20" />
                <p className="italic">Nenhum log disponível para este projeto no momento.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Linhas:</span>
            {[100, 200, 500, 1000].map((v) => (
              <Button
                key={v}
                variant={tail === v ? "default" : "outline"}
                size="sm"
                className={`h-7 px-3 text-[10px] ${tail === v ? 'bg-primary text-primary-foreground' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
                onClick={() => setTail(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

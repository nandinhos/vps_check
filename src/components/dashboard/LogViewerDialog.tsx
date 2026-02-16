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
import { useContainerLogs } from "@/lib/hooks/use-api";
import { RefreshCw, Terminal, Download, Trash2 } from "lucide-react";
import { useClearContainerLogs } from "@/lib/hooks/use-api";
import { useToast } from "@/components/ui/toast";

interface LogViewerDialogProps {
  containerId: string;
  containerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogViewerDialog({
  containerId,
  containerName,
  open,
  onOpenChange,
}: LogViewerDialogProps) {
  const [tail, setTail] = useState(200);
  const { data, isLoading, refetch, isFetching } = useContainerLogs(containerId, tail, open);
  const clearLogs = useClearContainerLogs();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novos logs chegam
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
    a.download = `${containerName}-logs.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClear = async () => {
    try {
      await clearLogs.mutateAsync(containerId);
      toast({
        title: "Logs limpos",
        description: "Os logs do container foram limpos com sucesso.",
        variant: "success",
      });
      refetch();
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao limpar os logs.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl">Logs: {containerName}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()} 
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
          <DialogDescription>
            Exibindo as últimas {tail} linhas de log do container.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 bg-zinc-950 m-6 mt-2 rounded-lg border border-zinc-800 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap" ref={scrollRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Carregando logs...
              </div>
            ) : data?.logs ? (
              data.logs
            ) : (
              <p className="text-zinc-500 italic">Nenhum log disponível.</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/50 flex justify-between items-center px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Linhas:</span>
            {[100, 200, 500, 1000].map((v) => (
              <Button
                key={v}
                variant={tail === v ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={() => setTail(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

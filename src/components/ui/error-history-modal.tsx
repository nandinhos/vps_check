'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useErrorStore } from '@/lib/hooks/use-error-store';
import { ContainerError, ErrorAction } from '@/types/error';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Copy, Trash2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ErrorHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ErrorHistoryModal({ open, onClose }: ErrorHistoryModalProps) {
  const { errors, removeError, clearErrors } = useErrorStore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<ErrorAction | 'all'>('all');

  const filteredErrors = filter === 'all' 
    ? errors 
    : errors.filter(e => e.action === filter);

  const copyStackTrace = (error: ContainerError) => {
    navigator.clipboard.writeText(error.stackTrace || error.dockerError || 'Sem stack trace');
    toast({ title: 'Stack trace copiado', variant: 'success' });
  };

  const copyAllStackTraces = () => {
    const allTraces = filteredErrors
      .map(e => `=== ${e.containerName} - ${e.action} ===\n${e.stackTrace || e.dockerError}`)
      .join('\n\n');
    navigator.clipboard.writeText(allTraces);
    toast({ title: 'Todos os stack traces copiados', variant: 'success' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Histórico de Erros ({filteredErrors.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            {(['start', 'stop', 'restart', 'delete'] as ErrorAction[]).map(action => (
              <Button
                key={action}
                variant={filter === action ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(action)}
              >
                {action}
              </Button>
            ))}
          </div>

          {/* Lista de erros */}
          <Accordion type="single" collapsible className="space-y-2">
            {filteredErrors.map((error) => (
              <AccordionItem key={error.id} value={error.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                  <div className="flex items-center gap-3 text-left w-full">
                    <Badge variant="destructive">{error.action}</Badge>
                    <span className="font-medium">{error.containerName}</span>
                    <span className="text-muted-foreground text-sm ml-auto">
                      {formatDate(error.timestamp)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-destructive">{error.title}</h4>
                      <p className="text-sm mt-1">{error.message}</p>
                    </div>
                    
                    {error.suggestion && (
                      <div className="bg-muted p-3 rounded-md">
                        <h5 className="text-sm font-medium mb-1">Como resolver:</h5>
                        <p className="text-sm text-muted-foreground">{error.suggestion}</p>
                      </div>
                    )}

                    <div className="bg-black text-green-400 p-3 rounded-md font-mono text-xs overflow-x-auto max-h-48">
                      <h5 className="text-gray-400 mb-1">Stack Trace:</h5>
                      <pre className="whitespace-pre-wrap">{error.stackTrace || error.dockerError}</pre>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyStackTrace(error)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar Stack
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeError(error.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredErrors.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum erro encontrado
            </p>
          )}

          {/* Ações em massa */}
          {filteredErrors.length > 0 && (
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={copyAllStackTraces}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar Todos
              </Button>
              <Button variant="destructive" onClick={clearErrors}>
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar Histórico
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { detectService, getServiceUrl, getConnectionString } from '@/lib/utils/ports';

interface PortLinkProps {
  hostPort: number;
  containerPort: number;
  host: string;
}

export function PortLink({ hostPort, containerPort, host }: PortLinkProps) {
  const { toast } = useToast();
  const service = detectService(containerPort);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const connectionString = getConnectionString(service, host, hostPort);
    await navigator.clipboard.writeText(connectionString);
    setIsCopied(true);
    toast({ title: 'Copiado!', variant: 'success' });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const url = getServiceUrl(service, host, hostPort);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        {hostPort}:{containerPort}
      </span>
      <span className="text-xs bg-muted px-2 py-0.5 rounded">
        {service.label}
      </span>
      
      {service.hasLink ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
        >
          <ExternalLink className="h-3 w-3" />
          Acessar
        </a>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleCopy}
        >
          <Copy className="h-3 w-3 mr-1" />
          {isCopied ? 'Copiado!' : 'Copiar'}
        </Button>
      )}
    </div>
  );
}

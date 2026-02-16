'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalContentProps {
  containerId: string;
  containerName: string;
  onError: (msg: string) => void;
}

export default function TerminalContent({ containerId, containerName, onError }: TerminalContentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (terminalRef.current && !xtermRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#000000',
          foreground: '#ffffff',
        }
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();
      xtermRef.current = term;

      const host = window.location.hostname;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const port = 45001; 
      
      const ws = new WebSocket(`${protocol}//${host}:${port}?containerId=${containerId}&token=session`);
      wsRef.current = ws;

      ws.onopen = () => {
        term.write('\x1b[1;32m> Conectado ao container ' + containerName + '\x1b[0m\r\n');
        term.write('\x1b[1;33m> ATENÇÃO: Modo Super Admin Ativo. Proceda com cuidado.\x1b[0m\r\n\r\n');
      };

      ws.onmessage = (event) => term.write(event.data);
      ws.onerror = () => onError('Falha na conexão com o console.');
      ws.onclose = () => term.write('\r\n\x1b[1;31m> Conexão encerrada.\x1b[0m\r\n');

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
      });

      const handleResize = () => fitAddon.fit();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        wsRef.current?.close();
        if (xtermRef.current) {
          xtermRef.current.dispose();
          xtermRef.current = null;
        }
      };
    }
  }, [containerId, containerName, onError]);

  return <div ref={terminalRef} className="h-full w-full" />;
}

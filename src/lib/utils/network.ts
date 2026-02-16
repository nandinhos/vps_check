'use client';

import { useState, useEffect } from 'react';

export function getLocalIpAddress(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }
  
  // Tentar usar o hostname atual primeiro
  const hostname = window.location.hostname;
  if (hostname && hostname !== 'localhost' && hostname !== '0.0.0.0') {
    return hostname;
  }
  
  return 'localhost';
}

export function useHostAddress(): string {
  const [host, setHost] = useState('localhost');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '0.0.0.0') {
        setHost(hostname);
      }
    }
  }, []);
  
  return host;
}

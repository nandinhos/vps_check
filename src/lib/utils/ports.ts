export interface ServiceInfo {
  type: 'http' | 'https' | 'mysql' | 'postgres' | 'redis' | 'mongodb' | 'other';
  label: string;
  hasLink: boolean;
  copyFormat?: string;
}

const PORT_SERVICES: Record<number, ServiceInfo> = {
  80: { type: 'http', label: 'HTTP', hasLink: true },
  443: { type: 'https', label: 'HTTPS', hasLink: true },
  3000: { type: 'http', label: 'Dev Server', hasLink: true },
  3306: { type: 'mysql', label: 'MySQL', hasLink: false, copyFormat: 'mysql://{host}:{port}' },
  5432: { type: 'postgres', label: 'PostgreSQL', hasLink: false, copyFormat: 'postgresql://{host}:{port}' },
  6379: { type: 'redis', label: 'Redis', hasLink: false, copyFormat: 'redis://{host}:{port}' },
  27017: { type: 'mongodb', label: 'MongoDB', hasLink: false, copyFormat: 'mongodb://{host}:{port}' },
  8080: { type: 'http', label: 'HTTP Alt', hasLink: true },
  8443: { type: 'https', label: 'HTTPS Alt', hasLink: true },
  9000: { type: 'http', label: 'phpMyAdmin', hasLink: true },
  8081: { type: 'http', label: 'Admin', hasLink: true },
  5000: { type: 'http', label: 'Flask/ASP.NET', hasLink: true },
  8000: { type: 'http', label: 'Django', hasLink: true },
  4000: { type: 'http', label: 'GraphQL', hasLink: true },
  9200: { type: 'http', label: 'Elasticsearch', hasLink: true },
  11211: { type: 'other', label: 'Memcached', hasLink: false },
};

export function detectService(port: number): ServiceInfo {
  return PORT_SERVICES[port] || { type: 'other', label: `Port ${port}`, hasLink: false };
}

export function getConnectionString(service: ServiceInfo, host: string, port: number): string {
  if (!service.copyFormat) return `${host}:${port}`;
  return service.copyFormat.replace('{host}', host).replace('{port}', port.toString());
}

export function getServiceUrl(service: ServiceInfo, host: string, port: number): string {
  const protocol = service.type === 'https' ? 'https' : 'http';
  return `${protocol}://${host}:${port}`;
}

export function categorizePorts(ports: { containerPort: number }[]): {
  web: number[];
  databases: number[];
  other: number[];
} {
  const webPorts = [80, 443, 3000, 8080, 8443, 8081, 5000, 8000, 4000, 9000, 9200];
  const dbPorts = [3306, 5432, 6379, 27017, 11211];
  
  const web: number[] = [];
  const databases: number[] = [];
  const other: number[] = [];
  
  ports.forEach(p => {
    const port = p.containerPort;
    if (webPorts.includes(port)) {
      web.push(port);
    } else if (dbPorts.includes(port)) {
      databases.push(port);
    } else {
      other.push(port);
    }
  });
  
  return { web, databases, other };
}

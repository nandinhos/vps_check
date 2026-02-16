export interface PortMapping {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
  isExposed: boolean;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  imageId: string;
  status: string;
  state: string;
  created: number;
  logSize: number;
  ports?: PortMapping[];
  lastSeenAt?: Date;
}

export interface ContainerCreateInput {
  id: string;
  name: string;
  image: string;
  imageId: string;
  status: string;
  state: string;
  created: number;
  logSize: number;
  ports: PortMapping[];
}

export interface ContainerUpdateInput {
  logSize?: number;
  status?: string;
  state?: string;
}

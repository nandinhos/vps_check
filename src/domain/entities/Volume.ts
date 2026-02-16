export interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  inUse: boolean;
  size?: number;
  lastSeenAt?: Date;
}

export interface VolumeCreateInput {
  name: string;
  driver: string;
  mountpoint: string;
  inUse: boolean;
  size?: number;
}

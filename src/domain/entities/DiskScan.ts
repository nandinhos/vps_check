export interface DiskScan {
  id: string;
  path: string;
  size: number;
  formattedSize: string;
  scannedAt: Date;
}

export interface DiskScanCreateInput {
  path: string;
  size: number;
  formattedSize: string;
}

export interface DiskUsage {
  id?: string;
  path: string;
  size: number;
  formattedSize: string;
  scannedAt?: Date;
}

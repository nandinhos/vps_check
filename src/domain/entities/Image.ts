export interface Image {
  id: string;
  name: string;
  size: number;
  created: number;
  tag: string;
  isDangling: boolean;
  inUse: boolean;
  containers?: { id: string; name: string }[];
  lastSeenAt?: Date;
}

export interface ImageCreateInput {
  id: string;
  name: string;
  size: number;
  created: number;
  tag: string;
  isDangling: boolean;
  inUse: boolean;
}

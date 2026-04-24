export interface Destination {
  type: string;
  label: string;
  description: string;
  icon: string;
  isDefault: boolean;
  removable: boolean;
}

export type DestinationConfig = {
  destinations: Destination[];
};

export interface Destination {
  type: string;
  label: string;
  description: string;
  icon: string;
  isDefault: boolean;
  removable: boolean;
}
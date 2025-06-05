export interface SavedColor {
  id: string;
  color: string;
  name?: string;
  timestamp: number;
  source?: "camera" | "gallery" | "picker";
}

export interface SavedPalette {
  id: string;
  name: string;
  colors: string[];
  scheme?: string;
  timestamp: number;
  description?: string;
}

export interface ColorPackage {
  id: string;
  name: string;
  description?: string;
  colors: SavedColor[];
  palettes: SavedPalette[];
  timestamp: number;
  isDefault?: boolean;
}

export interface LibraryData {
  packages: ColorPackage[];
  defaultPackageId?: string;
}

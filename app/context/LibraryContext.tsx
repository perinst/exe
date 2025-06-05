import React, { createContext, useContext, useState, useCallback } from "react";
import { Alert } from "react-native";
import { LibraryStorage } from "../utils/libraryStorage";
import { SavedColor, SavedPalette, ColorPackage } from "../types/library";

interface LibraryContextType {
  saveColor: (
    color: string,
    name?: string,
    source?: "camera" | "gallery" | "picker"
  ) => Promise<void>;
  saveColorToPackage: (
    color: string,
    packageId: string,
    name?: string,
    source?: "camera" | "gallery" | "picker"
  ) => Promise<void>;
  savePalette: (palette: {
    name: string;
    colors: string[];
    scheme?: string;
    description?: string;
  }) => Promise<void>;
  savePaletteToPackage: (
    palette: {
      name: string;
      colors: string[];
      scheme?: string;
      description?: string;
    },
    packageId: string
  ) => Promise<void>;
  getDefaultPackage: () => Promise<ColorPackage | null>;
  getAllPackages: () => Promise<ColorPackage[]>;
  showPackageSelector?: boolean;
  setShowPackageSelector?: (show: boolean) => void;
  pendingColorSave?: {
    color: string;
    name?: string;
    source?: "camera" | "gallery" | "picker";
  } | null;
  setPendingColorSave?: (
    pending: {
      color: string;
      name?: string;
      source?: "camera" | "gallery" | "picker";
    } | null
  ) => void;
  pendingPaletteSave?: {
    name: string;
    colors: string[];
    scheme?: string;
    description?: string;
  } | null;
  setPendingPaletteSave?: (
    pending: {
      name: string;
      colors: string[];
      scheme?: string;
      description?: string;
    } | null
  ) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
};

interface LibraryProviderProps {
  children: React.ReactNode;
}

export const LibraryProvider: React.FC<LibraryProviderProps> = ({
  children,
}) => {
  const [showPackageSelector, setShowPackageSelector] = useState(false);
  const [pendingColorSave, setPendingColorSave] = useState<{
    color: string;
    name?: string;
    source?: "camera" | "gallery" | "picker";
  } | null>(null);
  const [pendingPaletteSave, setPendingPaletteSave] = useState<{
    name: string;
    colors: string[];
    scheme?: string;
    description?: string;
  } | null>(null);
  const saveColor = useCallback(
    async (
      color: string,
      name?: string,
      source?: "camera" | "gallery" | "picker"
    ) => {
      try {
        const savedColor: SavedColor = {
          id: `color_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          color: color,
          name: name,
          timestamp: Date.now(),
          source: source,
        };

        await LibraryStorage.saveColor(savedColor);
        Alert.alert(
          "Color Saved",
          `Color ${color} has been saved to your library!`
        );
      } catch (error) {
        console.error("Error saving color:", error);
        Alert.alert("Error", "Failed to save color to library");
      }
    },
    []
  );
  const saveColorToPackage = useCallback(
    async (
      color: string,
      packageId: string,
      name?: string,
      source?: "camera" | "gallery" | "picker"
    ) => {
      try {
        console.log("LibraryContext: saveColorToPackage called with:", {
          color,
          packageId,
          name,
          source,
        });

        const savedColor: SavedColor = {
          id: `color_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          color: color,
          name: name,
          timestamp: Date.now(),
          source: source,
        };

        console.log("LibraryContext: Saving color to package:", savedColor);

        await LibraryStorage.saveColor(savedColor, packageId);

        console.log("LibraryContext: Color saved successfully");
        Alert.alert(
          "Color Saved",
          `Color ${color} has been saved to your library!`
        );
      } catch (error) {
        console.error("Error saving color:", error);
        Alert.alert("Error", "Failed to save color to library");
      }
    },
    []
  );
  const savePalette = useCallback(
    async (palette: {
      name: string;
      colors: string[];
      scheme?: string;
      description?: string;
    }) => {
      try {
        const savedPalette: SavedPalette = {
          id: `palette_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          name: palette.name,
          colors: palette.colors,
          scheme: palette.scheme,
          description: palette.description,
          timestamp: Date.now(),
        };

        await LibraryStorage.savePalette(savedPalette);
        Alert.alert(
          "Palette Saved",
          `Palette "${palette.name}" has been saved to your library!`
        );
      } catch (error) {
        console.error("Error saving palette:", error);
        Alert.alert("Error", "Failed to save palette to library");
      }
    },
    []
  );

  const savePaletteToPackage = useCallback(
    async (
      palette: {
        name: string;
        colors: string[];
        scheme?: string;
        description?: string;
      },
      packageId: string
    ) => {
      try {
        const savedPalette: SavedPalette = {
          id: `palette_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          name: palette.name,
          colors: palette.colors,
          scheme: palette.scheme,
          description: palette.description,
          timestamp: Date.now(),
        };

        await LibraryStorage.savePalette(savedPalette, packageId);
        Alert.alert(
          "Palette Saved",
          `Palette "${palette.name}" has been saved to your library!`
        );
      } catch (error) {
        console.error("Error saving palette:", error);
        Alert.alert("Error", "Failed to save palette to library");
      }
    },
    []
  );

  const getDefaultPackage = useCallback(async () => {
    try {
      return await LibraryStorage.getDefaultPackage();
    } catch (error) {
      console.error("Error getting default package:", error);
      return null;
    }
  }, []);

  const getAllPackages = useCallback(async () => {
    try {
      return await LibraryStorage.getAllPackages();
    } catch (error) {
      console.error("Error getting all packages:", error);
      return [];
    }
  }, []);
  const value: LibraryContextType = {
    saveColor,
    saveColorToPackage,
    savePalette,
    savePaletteToPackage,
    getDefaultPackage,
    getAllPackages,
    showPackageSelector,
    setShowPackageSelector,
    pendingColorSave,
    setPendingColorSave,
    pendingPaletteSave,
    setPendingPaletteSave,
  };

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
};

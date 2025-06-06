import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LibraryData,
  ColorPackage,
  SavedColor,
  SavedPalette,
} from "../types/library";

const STORAGE_KEYS = {
  LIBRARY_DATA: "color_library_data",
};

const DEFAULT_PACKAGE_NAME = "My Colors";

export class LibraryStorage {
  private static async getLibraryData(): Promise<LibraryData> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LIBRARY_DATA);

      if (data) {
        const parsedData = JSON.parse(data);
        return parsedData;
      }
    } catch (error) {
      console.error("Error loading library data:", error);
    }

    const defaultPackage: ColorPackage = {
      id: "default",
      name: DEFAULT_PACKAGE_NAME,
      colors: [],
      palettes: [],
      timestamp: Date.now(),
      isDefault: true,
    };

    const defaultData = {
      packages: [defaultPackage],
      defaultPackageId: "default",
    };

    // Save the default data to AsyncStorage for future use
    try {
      await this.saveLibraryData(defaultData);
    } catch (error) {
      console.error("LibraryStorage: Error saving default data:", error);
    }

    return defaultData;
  }

  private static async saveLibraryData(data: LibraryData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LIBRARY_DATA,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error("Error saving library data:", error);
      throw error;
    }
  }
  static async getAllPackages(): Promise<ColorPackage[]> {
    const data = await this.getLibraryData();
    return data.packages;
  }

  static async getPackage(packageId: string): Promise<ColorPackage | null> {
    const data = await this.getLibraryData();
    return data.packages.find((pkg) => pkg.id === packageId) || null;
  }

  static async createPackage(
    name: string,
    description?: string
  ): Promise<ColorPackage> {
    const data = await this.getLibraryData();

    const newPackage: ColorPackage = {
      id: `pkg_${Date.now()}`,
      name,
      description,
      colors: [],
      palettes: [],
      timestamp: Date.now(),
    };

    data.packages.push(newPackage);
    await this.saveLibraryData(data);

    return newPackage;
  }

  static async updatePackage(
    packageId: string,
    updates: Partial<ColorPackage>
  ): Promise<void> {
    const data = await this.getLibraryData();
    const packageIndex = data.packages.findIndex((pkg) => pkg.id === packageId);

    if (packageIndex === -1) {
      throw new Error("Package not found");
    }

    data.packages[packageIndex] = {
      ...data.packages[packageIndex],
      ...updates,
    };
    await this.saveLibraryData(data);
  }

  static async deletePackage(packageId: string): Promise<void> {
    const data = await this.getLibraryData();

    // Don't allow deleting the default package
    const packageToDelete = data.packages.find((pkg) => pkg.id === packageId);
    if (packageToDelete?.isDefault) {
      throw new Error("Cannot delete default package");
    }

    data.packages = data.packages.filter((pkg) => pkg.id !== packageId);

    // If we deleted the default package, set a new one
    if (data.defaultPackageId === packageId && data.packages.length > 0) {
      data.defaultPackageId = data.packages[0].id;
    }

    await this.saveLibraryData(data);
  }

  static async saveColor(color: SavedColor, packageId?: string): Promise<void> {
    const data = await this.getLibraryData();
    const targetPackageId =
      packageId || data.defaultPackageId || data.packages[0]?.id;

    if (!targetPackageId) {
      throw new Error("No package available to save color");
    }

    const packageIndex = data.packages.findIndex(
      (pkg) => pkg.id === targetPackageId
    );
    if (packageIndex === -1) {
      throw new Error("Package not found");
    }

    // Check if color already exists in the package
    const existingColorIndex = data.packages[packageIndex].colors.findIndex(
      (c) => c.color === color.color
    );

    if (existingColorIndex >= 0) {
      // Update existing color
      data.packages[packageIndex].colors[existingColorIndex] = color;
    } else {
      // Add new color
      data.packages[packageIndex].colors.push(color);
    }

    await this.saveLibraryData(data);
  }

  static async savePalette(
    palette: SavedPalette,
    packageId?: string
  ): Promise<void> {
    const data = await this.getLibraryData();
    const targetPackageId =
      packageId || data.defaultPackageId || data.packages[0]?.id;

    if (!targetPackageId) {
      throw new Error("No package available to save palette");
    }

    const packageIndex = data.packages.findIndex(
      (pkg) => pkg.id === targetPackageId
    );
    if (packageIndex === -1) {
      throw new Error("Package not found");
    }

    // Check if palette already exists
    const existingPaletteIndex = data.packages[packageIndex].palettes.findIndex(
      (p) => p.id === palette.id
    );

    if (existingPaletteIndex >= 0) {
      // Update existing palette
      data.packages[packageIndex].palettes[existingPaletteIndex] = palette;
    } else {
      // Add new palette
      data.packages[packageIndex].palettes.push(palette);
    }

    await this.saveLibraryData(data);
  }

  static async deleteColor(colorId: string, packageId: string): Promise<void> {
    const data = await this.getLibraryData();
    const packageIndex = data.packages.findIndex((pkg) => pkg.id === packageId);

    if (packageIndex === -1) {
      throw new Error("Package not found");
    }

    data.packages[packageIndex].colors = data.packages[
      packageIndex
    ].colors.filter((c) => c.id !== colorId);
    await this.saveLibraryData(data);
  }

  static async deletePalette(
    paletteId: string,
    packageId: string
  ): Promise<void> {
    const data = await this.getLibraryData();
    const packageIndex = data.packages.findIndex((pkg) => pkg.id === packageId);

    if (packageIndex === -1) {
      throw new Error("Package not found");
    }

    data.packages[packageIndex].palettes = data.packages[
      packageIndex
    ].palettes.filter((p) => p.id !== paletteId);
    await this.saveLibraryData(data);
  }

  static async setDefaultPackage(packageId: string): Promise<void> {
    const data = await this.getLibraryData();

    if (!data.packages.find((pkg) => pkg.id === packageId)) {
      throw new Error("Package not found");
    }

    data.defaultPackageId = packageId;
    await this.saveLibraryData(data);
  }

  static async getDefaultPackage(): Promise<ColorPackage | null> {
    const data = await this.getLibraryData();
    const defaultId = data.defaultPackageId;

    if (defaultId) {
      return data.packages.find((pkg) => pkg.id === defaultId) || null;
    }

    return data.packages[0] || null;
  }
}

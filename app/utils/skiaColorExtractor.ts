import { Skia, SkImage } from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system";

export interface ColorResult {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Skia-based Color Extraction Utility
 * Uses React Native Skia for efficient and accurate color extraction
 */
export class SkiaColorExtractor {
  private static imageCache = new Map<string, SkImage>();

  /**
   * Load and cache image using Skia
   * @param imageUri - URI of the image
   * @returns Promise<SkImage | null>
   */
  private static async loadSkiaImage(
    imageUri: string
  ): Promise<SkImage | null> {
    try {
      // Check cache first
      if (this.imageCache.has(imageUri)) {
        const cachedImage = this.imageCache.get(imageUri);
        if (cachedImage) {
          console.log("SkiaColorExtractor: Using cached image");
          return cachedImage;
        }
      }

      // Read image file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array
      const imageData = Skia.Data.fromBase64(base64);

      // Create Skia image
      const image = Skia.Image.MakeImageFromEncoded(imageData);

      if (image) {
        // Cache the image for future use
        this.imageCache.set(imageUri, image);
        console.log(
          `SkiaColorExtractor: Loaded image ${image.width()}×${image.height()}`
        );
        return image;
      }

      return null;
    } catch (error) {
      console.error("SkiaColorExtractor: Error loading image:", error);
      return null;
    }
  }

  /**
   * Extract color at specific pixel coordinates using Skia
   * @param imageUri - URI of the image
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Promise<ColorResult | null>
   */
  static async getColorAtPixel(
    imageUri: string,
    x: number,
    y: number
  ): Promise<ColorResult | null> {
    try {
      const image = await this.loadSkiaImage(imageUri);
      if (!image) {
        console.log("SkiaColorExtractor: Failed to load image");
        return null;
      }

      const width = image.width();
      const height = image.height();

      // Validate coordinates
      if (x < 0 || x >= width || y < 0 || y >= height) {
        console.log(
          `SkiaColorExtractor: Coordinates out of bounds: (${x}, ${y})`
        );
        return null;
      }

      // Create a canvas and paint the image
      const surface = Skia.Surface.Make(width, height);
      if (!surface) {
        console.log("SkiaColorExtractor: Failed to create surface");
        return null;
      }

      const canvas = surface.getCanvas();
      canvas.drawImage(image, 0, 0);

      // Read pixels from the image directly
      const pixels = image.readPixels();
      if (!pixels) {
        console.log("SkiaColorExtractor: Failed to read pixels");
        return null;
      }

      // Calculate pixel index (RGBA format, 4 bytes per pixel)
      const pixelIndex = (y * width + x) * 4;

      if (pixelIndex + 3 >= pixels.length) {
        console.log("SkiaColorExtractor: Pixel index out of range");
        return null;
      }

      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const a = pixels[pixelIndex + 3];

      console.log(
        `SkiaColorExtractor: Extracted color at (${x}, ${y}): RGBA(${r}, ${g}, ${b}, ${a})`
      );

      return { r, g, b, a };
    } catch (error) {
      console.error(
        "SkiaColorExtractor: Error extracting color at pixel:",
        error
      );
      return null;
    }
  }

  /**
   * Extract color from center of image
   * @param imageUri - URI of the image
   * @returns Promise<ColorResult | null>
   */
  static async extractCenterColor(
    imageUri: string
  ): Promise<ColorResult | null> {
    try {
      const image = await this.loadSkiaImage(imageUri);
      if (!image) {
        return null;
      }

      const centerX = Math.floor(image.width() / 2);
      const centerY = Math.floor(image.height() / 2);

      console.log(
        `SkiaColorExtractor: Extracting center color at (${centerX}, ${centerY})`
      );

      return await this.getColorAtPixel(imageUri, centerX, centerY);
    } catch (error) {
      console.error(
        "SkiaColorExtractor: Error extracting center color:",
        error
      );
      return null;
    }
  }

  /**
   * Extract multiple colors from an image using a sampling grid
   * @param imageUri - URI of the image
   * @param gridSize - Size of the sampling grid (e.g., 3 for 3x3 grid)
   * @returns Promise<ColorResult[]>
   */
  static async extractMultipleColors(
    imageUri: string,
    gridSize: number = 3
  ): Promise<ColorResult[]> {
    try {
      const image = await this.loadSkiaImage(imageUri);
      if (!image) {
        return [];
      }

      const width = image.width();
      const height = image.height();
      const colors: ColorResult[] = [];

      const stepX = Math.floor(width / (gridSize + 1));
      const stepY = Math.floor(height / (gridSize + 1));

      for (let i = 1; i <= gridSize; i++) {
        for (let j = 1; j <= gridSize; j++) {
          const x = i * stepX;
          const y = j * stepY;

          const color = await this.getColorAtPixel(imageUri, x, y);
          if (color) {
            colors.push(color);
          }
        }
      }

      console.log(
        `SkiaColorExtractor: Extracted ${colors.length} colors from ${gridSize}x${gridSize} grid`
      );
      return colors;
    } catch (error) {
      console.error(
        "SkiaColorExtractor: Error extracting multiple colors:",
        error
      );
      return [];
    }
  }

  /**
   * Extract average color from a region around a point
   * @param imageUri - URI of the image
   * @param centerX - Center X coordinate
   * @param centerY - Center Y coordinate
   * @param radius - Radius of the region to sample
   * @returns Promise<ColorResult | null>
   */
  static async extractRegionAverageColor(
    imageUri: string,
    centerX: number,
    centerY: number,
    radius: number = 2
  ): Promise<ColorResult | null> {
    try {
      const image = await this.loadSkiaImage(imageUri);
      if (!image) {
        return null;
      }

      const width = image.width();
      const height = image.height();
      const colors: ColorResult[] = [];

      // Sample pixels in a square region around the center point
      const startX = Math.max(0, centerX - radius);
      const endX = Math.min(width - 1, centerX + radius);
      const startY = Math.max(0, centerY - radius);
      const endY = Math.min(height - 1, centerY + radius);

      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const color = await this.getColorAtPixel(imageUri, x, y);
          if (color) {
            colors.push(color);
          }
        }
      }

      if (colors.length === 0) {
        return null;
      }

      // Calculate average color
      const avgColor = this.calculateAverageColor(colors);

      console.log(
        `SkiaColorExtractor: Average color from ${colors.length} pixels around (${centerX}, ${centerY}): RGB(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`
      );

      return avgColor;
    } catch (error) {
      console.error(
        "SkiaColorExtractor: Error extracting region average color:",
        error
      );
      return null;
    }
  }

  /**
   * Calculate average color from an array of colors
   * @param colors - Array of ColorResult objects
   * @returns ColorResult
   */
  private static calculateAverageColor(colors: ColorResult[]): ColorResult {
    if (colors.length === 0) {
      return { r: 128, g: 128, b: 128, a: 255 };
    }
    const sum = colors.reduce(
      (acc, color) => ({
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b,
        a: (acc.a || 0) + (color.a || 255),
      }),
      { r: 0, g: 0, b: 0, a: 0 }
    );
    return {
      r: Math.round(sum.r / colors.length),
      g: Math.round(sum.g / colors.length),
      b: Math.round(sum.b / colors.length),
      a: Math.round((sum.a || 0) / colors.length),
    };
  }

  /**
   * Get image dimensions
   * @param imageUri - URI of the image
   * @returns Promise<{width: number, height: number} | null>
   */
  static async getImageDimensions(
    imageUri: string
  ): Promise<{ width: number; height: number } | null> {
    try {
      const image = await this.loadSkiaImage(imageUri);
      if (!image) {
        return null;
      }

      return {
        width: image.width(),
        height: image.height(),
      };
    } catch (error) {
      console.error(
        "SkiaColorExtractor: Error getting image dimensions:",
        error
      );
      return null;
    }
  }

  /**
   * Clear the image cache
   */
  static clearCache(): void {
    this.imageCache.clear();
    console.log("SkiaColorExtractor: Image cache cleared");
  }

  /**
   * Extract dominant colors from image using color quantization
   * @param imageUri - URI of the image
   * @param maxColors - Maximum number of colors to extract
   * @returns Promise<ColorResult[]>
   */
  static async extractDominantColors(
    imageUri: string,
    maxColors: number = 5
  ): Promise<ColorResult[]> {
    try {
      const image = await this.loadSkiaImage(imageUri);
      if (!image) {
        return [];
      }

      const width = image.width();
      const height = image.height();

      // Create surface and read all pixels
      const surface = Skia.Surface.Make(width, height);
      if (!surface) {
        return [];
      }

      const canvas = surface.getCanvas();
      canvas.drawImage(image, 0, 0); // Read pixels from the image directly
      const pixels = image.readPixels();
      if (!pixels) {
        return [];
      }

      // Sample pixels (to avoid processing too many pixels)
      const sampleStep = Math.max(1, Math.floor(pixels.length / (4 * 1000))); // Sample ~1000 pixels
      const colorCounts = new Map<
        string,
        { color: ColorResult; count: number }
      >();

      for (let i = 0; i < pixels.length; i += 4 * sampleStep) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Quantize colors to reduce variations
        const quantizedR = Math.floor(r / 16) * 16;
        const quantizedG = Math.floor(g / 16) * 16;
        const quantizedB = Math.floor(b / 16) * 16;

        const key = `${quantizedR}-${quantizedG}-${quantizedB}`;

        if (colorCounts.has(key)) {
          colorCounts.get(key)!.count++;
        } else {
          colorCounts.set(key, {
            color: { r: quantizedR, g: quantizedG, b: quantizedB, a },
            count: 1,
          });
        }
      }

      // Sort by count and return top colors
      const sortedColors = Array.from(colorCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, maxColors)
        .map((item) => item.color);

      console.log(
        `SkiaColorExtractor: Extracted ${sortedColors.length} dominant colors`
      );
      return sortedColors;
    } catch (error) {
      console.error(
        "SkiaColorExtractor: Error extracting dominant colors:",
        error
      );
      return [];
    }
  }
}

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
  private static pixelCache = new Map<string, Uint8Array | Float32Array>();
  private static readonly MAX_CACHE_SIZE = 10;
  /**
   * Load and cache image using Skia with optimized caching
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
      } // Manage cache size
      if (this.imageCache.size >= this.MAX_CACHE_SIZE) {
        const firstKey = this.imageCache.keys().next().value;
        if (firstKey) {
          this.imageCache.delete(firstKey);
          this.pixelCache.delete(firstKey);
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
   * Get pixels from image with caching for better performance
   * @param imageUri - URI of the image
   * @returns Promise<{pixels: Uint8Array, width: number, height: number} | null>
   */
  private static async getImagePixels(
    imageUri: string
  ): Promise<{ pixels: Uint8Array; width: number; height: number } | null> {
    try {
      // Check pixel cache first
      if (this.pixelCache.has(imageUri)) {
        const cachedPixels = this.pixelCache.get(imageUri);
        const cachedImage = this.imageCache.get(imageUri);
        if (cachedPixels && cachedImage) {
          return {
            pixels: cachedPixels,
            width: cachedImage.width(),
            height: cachedImage.height(),
          };
        }
      }

      const image = await this.loadSkiaImage(imageUri);
      if (!image) {
        return null;
      }

      const width = image.width();
      const height = image.height();

      // Read pixels directly from image - more efficient
      const pixels = image.readPixels();
      if (!pixels) {
        console.log("SkiaColorExtractor: Failed to read pixels");
        return null;
      }

      // Cache pixels for future use
      this.pixelCache.set(imageUri, pixels);

      return { pixels, width, height };
    } catch (error) {
      console.error("SkiaColorExtractor: Error getting image pixels:", error);
      return null;
    }
  }
  /**
   * Extract color at specific pixel coordinates using optimized Skia approach
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
      const imageData = await this.getImagePixels(imageUri);
      if (!imageData) {
        console.log("SkiaColorExtractor: Failed to load image data");
        return null;
      }

      const { pixels, width, height } = imageData;

      // Validate coordinates
      if (x < 0 || x >= width || y < 0 || y >= height) {
        console.log(
          `SkiaColorExtractor: Coordinates out of bounds: (${x}, ${y})`
        );
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
   * Extract multiple colors from an image using optimized batch processing
   * @param imageUri - URI of the image
   * @param gridSize - Size of the sampling grid (e.g., 3 for 3x3 grid)
   * @returns Promise<ColorResult[]>
   */
  static async extractMultipleColors(
    imageUri: string,
    gridSize: number = 3
  ): Promise<ColorResult[]> {
    try {
      const imageData = await this.getImagePixels(imageUri);
      if (!imageData) {
        return [];
      }

      const { pixels, width, height } = imageData;
      const colors: ColorResult[] = [];

      const stepX = Math.floor(width / (gridSize + 1));
      const stepY = Math.floor(height / (gridSize + 1));

      // Batch process pixels for better performance
      for (let i = 1; i <= gridSize; i++) {
        for (let j = 1; j <= gridSize; j++) {
          const x = i * stepX;
          const y = j * stepY;

          // Validate coordinates
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const pixelIndex = (y * width + x) * 4;

            if (pixelIndex + 3 < pixels.length) {
              const r = pixels[pixelIndex];
              const g = pixels[pixelIndex + 1];
              const b = pixels[pixelIndex + 2];
              const a = pixels[pixelIndex + 3];

              colors.push({ r, g, b, a });
            }
          }
        }
      }

      console.log(
        `SkiaColorExtractor: Extracted ${colors.length} colors from ${gridSize}x${gridSize} grid (optimized)`
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
   * Extract average color from a region around a point with optimized processing
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
      const imageData = await this.getImagePixels(imageUri);
      if (!imageData) {
        return null;
      }

      const { pixels, width, height } = imageData;
      let totalR = 0,
        totalG = 0,
        totalB = 0,
        totalA = 0;
      let validPixels = 0;

      // Sample pixels in a square region around the center point
      const startX = Math.max(0, centerX - radius);
      const endX = Math.min(width - 1, centerX + radius);
      const startY = Math.max(0, centerY - radius);
      const endY = Math.min(height - 1, centerY + radius);

      // Batch process region for better performance
      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const pixelIndex = (y * width + x) * 4;

          if (pixelIndex + 3 < pixels.length) {
            totalR += pixels[pixelIndex];
            totalG += pixels[pixelIndex + 1];
            totalB += pixels[pixelIndex + 2];
            totalA += pixels[pixelIndex + 3];
            validPixels++;
          }
        }
      }

      if (validPixels === 0) {
        return null;
      }

      const avgColor: ColorResult = {
        r: Math.round(totalR / validPixels),
        g: Math.round(totalG / validPixels),
        b: Math.round(totalB / validPixels),
        a: Math.round(totalA / validPixels),
      };

      console.log(
        `SkiaColorExtractor: Average color from ${validPixels} pixels around (${centerX}, ${centerY}): RGBA(${avgColor.r}, ${avgColor.g}, ${avgColor.b}, ${avgColor.a})`
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
   * Clear both image and pixel caches
   */
  static clearCache(): void {
    this.imageCache.clear();
    this.pixelCache.clear();
    console.log("SkiaColorExtractor: Image and pixel caches cleared");
  }
  /**
   * Extract dominant colors from image using optimized color quantization
   * @param imageUri - URI of the image
   * @param maxColors - Maximum number of colors to extract
   * @param sampleRate - Sampling rate (1 = every pixel, 2 = every 2nd pixel, etc.)
   * @returns Promise<ColorResult[]>
   */
  static async extractDominantColors(
    imageUri: string,
    maxColors: number = 5,
    sampleRate: number = 4
  ): Promise<ColorResult[]> {
    try {
      const imageData = await this.getImagePixels(imageUri);
      if (!imageData) {
        return [];
      }

      const { pixels, width, height } = imageData;
      const colorCounts = new Map<
        string,
        { color: ColorResult; count: number }
      >();

      // Optimized sampling with configurable rate
      const totalPixels = width * height;
      const step = Math.max(1, sampleRate);

      for (let i = 0; i < totalPixels; i += step) {
        const pixelIndex = i * 4;

        if (pixelIndex + 3 >= pixels.length) break;

        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        const a = pixels[pixelIndex + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // More aggressive quantization for better grouping
        const quantizedR = Math.floor(r / 32) * 32;
        const quantizedG = Math.floor(g / 32) * 32;
        const quantizedB = Math.floor(b / 32) * 32;

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
        `SkiaColorExtractor: Extracted ${sortedColors.length} dominant colors (optimized, sample rate: ${sampleRate})`
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

  /**
   * Extract colors using adaptive sampling for high accuracy
   * @param imageUri - URI of the image
   * @param targetColors - Number of colors to extract
   * @param qualityLevel - Quality level (1-5, where 5 is highest quality)
   * @returns Promise<ColorResult[]>
   */
  static async extractAdaptiveColors(
    imageUri: string,
    targetColors: number = 8,
    qualityLevel: number = 3
  ): Promise<ColorResult[]> {
    try {
      const imageData = await this.getImagePixels(imageUri);
      if (!imageData) {
        return [];
      }

      const { pixels, width, height } = imageData;
      const sampleRate = Math.max(1, 6 - qualityLevel); // Higher quality = lower sample rate

      // Use k-means-like clustering for better color accuracy
      const initialColors = await this.getInitialColorCenters(
        pixels,
        width,
        height,
        targetColors,
        sampleRate
      );
      const refinedColors = this.refineColorCenters(
        pixels,
        width,
        height,
        initialColors,
        sampleRate
      );

      console.log(
        `SkiaColorExtractor: Extracted ${refinedColors.length} adaptive colors (quality: ${qualityLevel})`
      );
      return refinedColors;
    } catch (error) {
      console.error(
        "SkiaColorExtractor: Error extracting adaptive colors:",
        error
      );
      return [];
    }
  }

  /**
   * Get initial color centers using grid sampling
   */
  private static async getInitialColorCenters(
    pixels: Uint8Array,
    width: number,
    height: number,
    targetColors: number,
    sampleRate: number
  ): Promise<ColorResult[]> {
    const gridSize = Math.ceil(Math.sqrt(targetColors * 2));
    const stepX = Math.floor(width / gridSize);
    const stepY = Math.floor(height / gridSize);
    const colors: ColorResult[] = [];

    for (let i = 0; i < gridSize && colors.length < targetColors * 2; i++) {
      for (let j = 0; j < gridSize && colors.length < targetColors * 2; j++) {
        const x = Math.min(i * stepX + stepX / 2, width - 1);
        const y = Math.min(j * stepY + stepY / 2, height - 1);

        const pixelIndex = (Math.floor(y) * width + Math.floor(x)) * 4;

        if (pixelIndex + 3 < pixels.length) {
          const r = pixels[pixelIndex];
          const g = pixels[pixelIndex + 1];
          const b = pixels[pixelIndex + 2];
          const a = pixels[pixelIndex + 3];

          if (a > 128) {
            // Skip transparent pixels
            colors.push({ r, g, b, a });
          }
        }
      }
    }

    return colors;
  }

  /**
   * Refine color centers using simplified clustering
   */
  private static refineColorCenters(
    pixels: Uint8Array,
    width: number,
    height: number,
    initialColors: ColorResult[],
    sampleRate: number
  ): ColorResult[] {
    const colorCounts = new Map<
      string,
      {
        color: ColorResult;
        count: number;
        totalR: number;
        totalG: number;
        totalB: number;
        totalA: number;
      }
    >();

    // Sample pixels and assign to nearest initial color
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i += sampleRate) {
      const pixelIndex = i * 4;

      if (pixelIndex + 3 >= pixels.length) break;

      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const a = pixels[pixelIndex + 3];

      if (a < 128) continue; // Skip transparent pixels

      // Find nearest initial color
      let nearestColor = initialColors[0];
      let minDistance = this.getColorDistance({ r, g, b, a }, nearestColor);

      for (const color of initialColors) {
        const distance = this.getColorDistance({ r, g, b, a }, color);
        if (distance < minDistance) {
          minDistance = distance;
          nearestColor = color;
        }
      }

      const key = `${Math.floor(nearestColor.r / 16)}-${Math.floor(
        nearestColor.g / 16
      )}-${Math.floor(nearestColor.b / 16)}`;

      if (colorCounts.has(key)) {
        const entry = colorCounts.get(key)!;
        entry.count++;
        entry.totalR += r;
        entry.totalG += g;
        entry.totalB += b;
        entry.totalA += a;
      } else {
        colorCounts.set(key, {
          color: nearestColor,
          count: 1,
          totalR: r,
          totalG: g,
          totalB: b,
          totalA: a,
        });
      }
    }

    // Calculate average colors and sort by frequency
    return Array.from(colorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, initialColors.length)
      .map((entry) => ({
        r: Math.round(entry.totalR / entry.count),
        g: Math.round(entry.totalG / entry.count),
        b: Math.round(entry.totalB / entry.count),
        a: Math.round(entry.totalA / entry.count),
      }));
  }

  /**
   * Calculate Euclidean distance between two colors
   */
  private static getColorDistance(
    color1: ColorResult,
    color2: ColorResult
  ): number {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * Extract colors with perceptual weighting for better visual accuracy
   * @param imageUri - URI of the image
   * @param maxColors - Maximum number of colors to extract
   * @returns Promise<ColorResult[]>
   */
  static async extractPerceptualColors(
    imageUri: string,
    maxColors: number = 6
  ): Promise<ColorResult[]> {
    try {
      const imageData = await this.getImagePixels(imageUri);
      if (!imageData) {
        return [];
      }

      const { pixels, width, height } = imageData;
      const colorCounts = new Map<
        string,
        { color: ColorResult; count: number; weight: number }
      >();

      // Sample with perceptual weighting
      const totalPixels = width * height;
      const sampleRate = Math.max(1, Math.floor(totalPixels / 10000)); // Sample ~10k pixels max

      for (let i = 0; i < totalPixels; i += sampleRate) {
        const pixelIndex = i * 4;

        if (pixelIndex + 3 >= pixels.length) break;

        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        const a = pixels[pixelIndex + 3];

        if (a < 128) continue;

        // Perceptual quantization based on human vision sensitivity
        const quantizedR = Math.floor(r / 24) * 24;
        const quantizedG = Math.floor(g / 16) * 16; // Higher sensitivity to green
        const quantizedB = Math.floor(b / 32) * 32;

        // Calculate perceptual weight (luminance-based)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const weight = Math.max(0.1, luminance / 255); // Avoid zero weights

        const key = `${quantizedR}-${quantizedG}-${quantizedB}`;

        if (colorCounts.has(key)) {
          const entry = colorCounts.get(key)!;
          entry.count++;
          entry.weight += weight;
        } else {
          colorCounts.set(key, {
            color: { r: quantizedR, g: quantizedG, b: quantizedB, a },
            count: 1,
            weight: weight,
          });
        }
      }

      // Sort by weighted count for perceptually important colors
      const sortedColors = Array.from(colorCounts.values())
        .sort((a, b) => b.count * b.weight - a.count * a.weight)
        .slice(0, maxColors)
        .map((item) => item.color);

      console.log(
        `SkiaColorExtractor: Extracted ${sortedColors.length} perceptual colors`
      );
      return sortedColors;
    } catch (error) {
      console.error(
        "SkiaColorExtractor: Error extracting perceptual colors:",
        error
      );
      return [];
    }
  }

  /**
   * Get cache statistics for performance monitoring
   * @returns Object with cache statistics
   */
  static getCacheStats(): {
    imageCacheSize: number;
    pixelCacheSize: number;
    maxCacheSize: number;
  } {
    return {
      imageCacheSize: this.imageCache.size,
      pixelCacheSize: this.pixelCache.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
    };
  }
}

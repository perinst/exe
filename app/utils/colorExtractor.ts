import * as ImageManipulator from "expo-image-manipulator";

export interface ColorResult {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Color Extraction Utility
 * Contains all color extraction logic separated from UI components
 */
export class ColorExtractor {
  /**
   * Extract color at specific pixel coordinates using micro-cropping technique
   * @param imageUri - URI of the image
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param originalWidth - Original image width
   * @param originalHeight - Original image height
   * @returns Promise<ColorResult | null>
   */
  static async extractColorAtCoordinates(
    imageUri: string,
    x: number,
    y: number,
    originalWidth: number,
    originalHeight: number
  ): Promise<ColorResult | null> {
    try {
      // Create a tiny 3x3 crop around the target pixel for better accuracy
      const cropSize = 3;
      const halfCrop = Math.floor(cropSize / 2);

      // Ensure crop bounds are within image
      const cropX = Math.max(
        0,
        Math.min(originalWidth - cropSize, x - halfCrop)
      );
      const cropY = Math.max(
        0,
        Math.min(originalHeight - cropSize, y - halfCrop)
      );

      // console.log(
      //   `ColorExtractor: Extracting color at (${x}, ${y}) with ${cropSize}x${cropSize} crop from (${cropX}, ${cropY})`
      // );

      // Crop the specific region
      const croppedResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: cropSize,
              height: cropSize,
            },
          },
        ],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
          base64: true,
        }
      );

      if (!croppedResult.base64) {
        throw new Error("Failed to get base64 from cropped image");
      }

      // Convert the tiny crop to a larger size for easier analysis
      const scaledResult = await ImageManipulator.manipulateAsync(
        croppedResult.uri,
        [{ resize: { width: 100, height: 100 } }],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
          base64: true,
        }
      );

      if (!scaledResult.base64) {
        throw new Error("Failed to get base64 from scaled image");
      }

      // Extract colors from the scaled version and get the average
      const colors = await this.extractColorsFromBase64(scaledResult.base64);

      if (colors.length > 0) {
        // Calculate average color from all extracted colors
        const avgColor = this.calculateAverageColor(colors);

        return avgColor;
      }

      return null;
    } catch (error) {
      console.error(
        "ColorExtractor: Error extracting color at coordinates:",
        error
      );
      return null;
    }
  }

  /**
   * Extract actual colors from base64 image data
   * @param base64 - Base64 encoded image data
   * @returns Promise<ColorResult[]>
   */
  static async extractColorsFromBase64(base64: string): Promise<ColorResult[]> {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, "");

      // Convert base64 to binary
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const colors: ColorResult[] = [];

      // Look for color patterns in the PNG data
      // PNG stores pixel data in IDAT chunks, but we'll sample the entire file
      // to catch any RGB values that represent actual pixel colors

      let validColorCount = 0;
      const maxColors = 100; // Limit to prevent too much processing

      for (
        let i = 0;
        i < bytes.length - 2 && validColorCount < maxColors;
        i++
      ) {
        const r = bytes[i];
        const g = bytes[i + 1];
        const b = bytes[i + 2];

        // Check if this looks like a valid RGB color value
        if (this.isValidRGBColor(r, g, b)) {
          colors.push({ r, g, b });
          validColorCount++;
        }
      }

      return colors;
    } catch (error) {
      console.error(
        "ColorExtractor: Error extracting colors from base64:",
        error
      );
      return [];
    }
  }

  /**
   * Check if RGB values represent a valid color (not metadata or headers)
   * @param r - Red component (0-255)
   * @param g - Green component (0-255)
   * @param b - Blue component (0-255)
   * @returns boolean
   */
  static isValidRGBColor(r: number, g: number, b: number): boolean {
    // Filter out obviously invalid values
    if (r === undefined || g === undefined || b === undefined) return false;
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return false;

    // Filter out common PNG metadata patterns
    if (r === 0 && g === 0 && b === 0) return false; // Pure black (often padding)
    if (r === 255 && g === 255 && b === 255) return false; // Pure white (often padding)
    if (r === g && g === b && (r === 0 || r === 255)) return false; // Pure grayscale extremes

    // Filter out ASCII text ranges (common in metadata)
    if (r >= 32 && r <= 126 && g >= 32 && g <= 126 && b >= 32 && b <= 126) {
      // Could be text, be more selective
      const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
      return variance > 30; // Only accept if there's significant color variation
    }

    return true;
  }

  /**
   * Calculate average color from an array of colors
   * @param colors - Array of ColorResult objects
   * @returns ColorResult
   */
  static calculateAverageColor(colors: ColorResult[]): ColorResult {
    if (colors.length === 0) {
      return { r: 128, g: 128, b: 128 }; // Default gray
    }

    const sum = colors.reduce(
      (acc, color) => ({
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b,
      }),
      { r: 0, g: 0, b: 0 }
    );

    return {
      r: Math.round(sum.r / colors.length),
      g: Math.round(sum.g / colors.length),
      b: Math.round(sum.b / colors.length),
    };
  }

  /**
   * Get color at specific pixel with fallback to average color extraction
   * @param imageUri - URI of the image
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param imageDimensions - Image dimensions object
   * @returns Promise<ColorResult | null>
   */
  static async getColorAtPixel(
    imageUri: string,
    x: number,
    y: number,
    imageDimensions: { width: number; height: number }
  ): Promise<ColorResult | null> {
    if (!imageUri || !imageDimensions.width || !imageDimensions.height) {
      return null;
    }

    try {
      // Use the original image URI and dimensions for accurate extraction
      const color = await this.extractColorAtCoordinates(
        imageUri,
        x,
        y,
        imageDimensions.width,
        imageDimensions.height
      );

      if (color) {
        return { ...color, a: 255 };
      }

      return null;
    } catch (error) {
      console.error("ColorExtractor: Error in getColorAtPixel:", error);
      return null;
    }
  }

  /**
   * Extract color from center of image for real-time analysis
   * @param imageUri - URI of the image
   * @returns Promise<ColorResult | null>
   */
  static async extractCenterColor(
    imageUri: string
  ): Promise<ColorResult | null> {
    try {
      // Get image dimensions first
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
      });

      // Use the center point of the image for analysis
      const centerX = Math.floor(imageInfo.width / 2);
      const centerY = Math.floor(imageInfo.height / 2);

      // console.log(
      //   `ColorExtractor: Analyzing center pixel at (${centerX}, ${centerY}) of ${imageInfo.width}×${imageInfo.height} image`
      // );

      // Extract color at center using the coordinate extraction method
      const color = await this.extractColorAtCoordinates(
        imageUri,
        centerX,
        centerY,
        imageInfo.width,
        imageInfo.height
      );

      if (color) {
        // console.log(
        //   `ColorExtractor: Center color extracted: RGB(${color.r}, ${color.g}, ${color.b})`
        // );
        return color;
      }

      return null;
    } catch (error) {
      console.error("ColorExtractor: Error extracting center color:", error);
      return null;
    }
  }

  /**
   * Extract multiple colors from different regions of the image
   * @param imageUri - URI of the image
   * @param numSamples - Number of sample points to extract
   * @returns Promise<ColorResult[]>
   */
  static async extractMultipleColors(
    imageUri: string,
    numSamples: number = 9
  ): Promise<ColorResult[]> {
    try {
      // Get image dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
      });

      const colors: ColorResult[] = [];
      const samplesPerRow = Math.ceil(Math.sqrt(numSamples));

      for (let i = 0; i < samplesPerRow && colors.length < numSamples; i++) {
        for (let j = 0; j < samplesPerRow && colors.length < numSamples; j++) {
          const x = Math.floor(
            (imageInfo.width / (samplesPerRow + 1)) * (i + 1)
          );
          const y = Math.floor(
            (imageInfo.height / (samplesPerRow + 1)) * (j + 1)
          );

          const color = await this.extractColorAtCoordinates(
            imageUri,
            x,
            y,
            imageInfo.width,
            imageInfo.height
          );

          if (color) {
            colors.push(color);
          }
        }
      }

      console.log(
        `ColorExtractor: Extracted ${colors.length} colors from multiple regions`
      );
      return colors;
    } catch (error) {
      console.error("ColorExtractor: Error extracting multiple colors:", error);
      return [];
    }
  }
}

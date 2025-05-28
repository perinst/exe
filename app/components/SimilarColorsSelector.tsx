import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";

interface SimilarColor {
  hex: string;
  name: string;
  brightness: "darker" | "lighter" | "original";
}

interface SimilarColorsSelectorProps {
  baseColor: string; // HEX color string
  rybValues?: { r: number; y: number; b: number };
  onColorSelect?: (color: string) => void;
}

const SimilarColorsSelector = ({
  baseColor = "#3B82F6",
  rybValues,
  onColorSelect,
}: SimilarColorsSelectorProps) => {
  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .toUpperCase()}`;
  };

  // Generate color name based on brightness and hue
  const generateColorName = (
    hex: string,
    brightness: "darker" | "lighter" | "original"
  ): string => {
    const rgb = hexToRgb(hex);
    const { r, g, b } = rgb;

    // Determine dominant color component
    let dominantColor = "";
    if (r > g && r > b) {
      dominantColor = "Red";
    } else if (g > r && g > b) {
      dominantColor = "Green";
    } else if (b > r && b > g) {
      dominantColor = "Blue";
    } else if (r === g && r > b) {
      dominantColor = "Yellow";
    } else if (r === b && r > g) {
      dominantColor = "Magenta";
    } else if (g === b && g > r) {
      dominantColor = "Cyan";
    } else {
      dominantColor = "Gray";
    }

    // Add brightness modifier
    if (brightness === "darker") {
      return `Dark ${dominantColor}`;
    } else if (brightness === "lighter") {
      return `Light ${dominantColor}`;
    }
    return dominantColor;
  };

  // Generate similar colors based on brightness variations
  const generateSimilarColors = (): SimilarColor[] => {
    const baseRgb = hexToRgb(baseColor);
    const colors: SimilarColor[] = [];

    // Add original color
    colors.push({
      hex: baseColor,
      name: generateColorName(baseColor, "original"),
      brightness: "original",
    });

    // Generate darker variations
    for (let i = 1; i <= 4; i++) {
      const factor = 1 - i * 0.15; // 15% darker each step
      const darkerR = Math.max(0, Math.round(baseRgb.r * factor));
      const darkerG = Math.max(0, Math.round(baseRgb.g * factor));
      const darkerB = Math.max(0, Math.round(baseRgb.b * factor));
      const darkerHex = rgbToHex(darkerR, darkerG, darkerB);

      colors.unshift({
        hex: darkerHex,
        name: "", // TODO: fill name
        brightness: "darker",
      });
    }

    // Generate lighter variations
    for (let i = 1; i <= 4; i++) {
      const factor = i * 0.15; // 15% lighter each step
      const lighterR = Math.min(
        255,
        Math.round(baseRgb.r + (255 - baseRgb.r) * factor)
      );
      const lighterG = Math.min(
        255,
        Math.round(baseRgb.g + (255 - baseRgb.g) * factor)
      );
      const lighterB = Math.min(
        255,
        Math.round(baseRgb.b + (255 - baseRgb.b) * factor)
      );
      const lighterHex = rgbToHex(lighterR, lighterG, lighterB);

      colors.push({
        hex: lighterHex,
        name: `${generateColorName(lighterHex, "lighter")} ${i}`,
        brightness: "lighter",
      });
    }

    return colors;
  };

  // Simplified RYB to RGB conversion
  const rybToRgbApprox = (
    r: number,
    y: number,
    b: number
  ): { r: number; g: number; b: number } => {
    // This is a simplified conversion - in practice, you'd use a more accurate RYB to RGB conversion
    return {
      r: Math.min(255, r + y * 0.5),
      g: Math.min(255, y * 0.8 + r * 0.2),
      b: Math.min(255, b + r * 0.1),
    };
  };

  // Handle color selection and copy to clipboard
  const handleColorPress = async (color: SimilarColor) => {
    try {
      await Clipboard.setStringAsync(color.hex);
      Alert.alert(
        "Color Copied!",
        `${color.name} (${color.hex}) has been copied to clipboard.`,
        [{ text: "OK" }]
      );

      if (onColorSelect) {
        onColorSelect(color.hex);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to copy color to clipboard.");
    }
  };

  const similarColors = generateSimilarColors();

  return (
    <View className="bg-white p-4 rounded-lg shadow-md w-full mt-4 mb-4">
      <Text className="text-lg font-bold mb-3">Similar Colors</Text>
      <Text className="text-gray-600 text-sm mb-4">
        Tap any color to copy its hex code
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {similarColors.map((color, index) => (
          <TouchableOpacity
            key={`${color.hex}-${index}`}
            onPress={() => handleColorPress(color)}
            className="mr-3 items-center"
            style={{ minWidth: 80 }}
          >
            {/* Color Box */}
            <View
              style={{ backgroundColor: color.hex }}
              className="w-16 h-16 rounded-lg shadow-sm border border-gray-200"
            />

            {/* Color Info */}
            <View className="mt-2 items-center">
              {/* <Text
                className="text-xs font-medium text-center"
                numberOfLines={2}
                style={{ minHeight: 20 }}
              >
                {color.name}
              </Text> */}
              <Text className="text-xs text-gray-500 font-mono ">
                {color.hex}
              </Text>
            </View>

            {/* Brightness Indicator */}
            {color.brightness === "original" && (
              <View className="mt-1 px-2 py-1 bg-blue-100 rounded-full">
                <Text className="text-xs text-blue-600 font-medium">
                  Original
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default SimilarColorsSelector;

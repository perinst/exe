import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Copy } from "lucide-react-native";

interface ColorDetailsProps {
  color?: string; // HEX color string
  rgbValues?: { r: number; g: number; b: number };
  hslValues?: { h: number; s: number; l: number };
  cmykValues?: { c: number; m: number; y: number; k: number };
  rybValues?: { r: number; y: number; b: number };
}

const ColorDetails = ({
  color = "#3B82F6", // Default blue color
  rgbValues = { r: 59, g: 130, b: 246 },
  hslValues = { h: 217, s: 91, l: 60 },
  cmykValues = { c: 76, m: 47, y: 0, k: 4 },
  rybValues = { r: 59, y: 130, b: 116 },
}: ColorDetailsProps) => {
  // Calculate RYB values if not provided (using the specified algorithm)
  const calculatedRYB = {
    r: rgbValues.r,
    y: Math.min(rgbValues.g, rgbValues.b),
    b: Math.max(0, rgbValues.b - Math.min(rgbValues.g, rgbValues.b)),
  };

  // Use provided RYB values or calculated ones
  const ryb = rybValues || calculatedRYB;

  // Calculate component ratios
  const rybTotal = ryb.r + ryb.y + ryb.b;
  const rybRatios = {
    r: Math.round((ryb.r / rybTotal) * 100),
    y: Math.round((ryb.y / rybTotal) * 100),
    b: Math.round((ryb.b / rybTotal) * 100),
  };

  return (
    <View className="bg-white p-4 rounded-lg shadow-md w-full">
      {/* Color Preview */}
      <View className="flex-row items-center mb-4">
        <View
          style={{ backgroundColor: color }}
          className="w-16 h-16 rounded-lg mr-4 shadow"
        />
        <View>
          <Text className="text-lg font-bold">{color}</Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-gray-500 mr-2">Copy</Text>
            <Copy size={16} color="#6B7280" />
          </View>
        </View>
      </View>

      {/* Color Values */}
      <View className="space-y-4">
        {/* RGB Values */}
        <View>
          <Text className="font-bold mb-1">RGB</Text>
          <View className="flex-row justify-between bg-gray-100 p-2 rounded">
            <Text>R: {rgbValues.r}</Text>
            <Text>G: {rgbValues.g}</Text>
            <Text>B: {rgbValues.b}</Text>
          </View>
        </View>

        {/* HSL Values */}
        <View>
          <Text className="font-bold mb-1">HSL</Text>
          <View className="flex-row justify-between bg-gray-100 p-2 rounded">
            <Text>H: {hslValues.h}°</Text>
            <Text>S: {hslValues.s}%</Text>
            <Text>L: {hslValues.l}%</Text>
          </View>
        </View>

        {/* CMYK Values */}
        <View>
          <Text className="font-bold mb-1">CMYK</Text>
          <View className="flex-row justify-between bg-gray-100 p-2 rounded">
            <Text>C: {cmykValues.c}%</Text>
            <Text>M: {cmykValues.m}%</Text>
            <Text>Y: {cmykValues.y}%</Text>
            <Text>K: {cmykValues.k}%</Text>
          </View>
        </View>

        {/* RYB Values */}
        <View>
          <Text className="font-bold mb-1">RYB (Artist Color Model)</Text>
          <View className="bg-gray-100 p-2 rounded">
            <View className="flex-row justify-between mb-2">
              <Text>R: {ryb.r}</Text>
              <Text>Y: {ryb.y}</Text>
              <Text>B: {ryb.b}</Text>
            </View>

            {/* RYB Component Ratios */}
            <Text className="font-bold mt-2 mb-1">Component Ratios:</Text>
            <View className="flex-row h-6 rounded overflow-hidden mb-1">
              <View
                style={{ width: `${rybRatios.r}%`, backgroundColor: "#FF5252" }}
                className="h-full"
              />
              <View
                style={{ width: `${rybRatios.y}%`, backgroundColor: "#FFD740" }}
                className="h-full"
              />
              <View
                style={{ width: `${rybRatios.b}%`, backgroundColor: "#448AFF" }}
                className="h-full"
              />
            </View>
            <View className="flex-row justify-between">
              <Text>Red: {rybRatios.r}%</Text>
              <Text>Yellow: {rybRatios.y}%</Text>
              <Text>Blue: {rybRatios.b}%</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ColorDetails;

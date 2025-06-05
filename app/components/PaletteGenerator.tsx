import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  Palette,
  Sliders,
  Save,
  Download,
  Plus,
  Trash2,
} from "lucide-react-native";
import { Image } from "expo-image";

type ColorScheme =
  | "complementary"
  | "analogous"
  | "monochromatic"
  | "triadic"
  | "tetradic";

type ColorPalette = {
  id: string;
  name: string;
  colors: string[];
  scheme: ColorScheme;
};

interface PaletteGeneratorProps {
  baseColor?: string;
  onSavePalette?: (palette: ColorPalette) => void;
  onExportPalette?: (palette: ColorPalette, format: string) => void;
}

const PaletteGenerator: React.FC<PaletteGeneratorProps> = ({
  baseColor = "#3B82F6",
  onSavePalette = () => {},
  onExportPalette = () => {},
}) => {
  const [selectedScheme, setSelectedScheme] =
    useState<ColorScheme>("complementary");
  const [paletteName, setPaletteName] = useState("My Palette");
  const [currentBaseColor, setCurrentBaseColor] = useState(baseColor);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Generate sample palettes based on the scheme
  const generatePalette = (
    scheme: ColorScheme,
    baseColor: string
  ): string[] => {
    // This is a simplified implementation - in a real app, you would use proper color theory algorithms
    switch (scheme) {
      case "complementary":
        return [baseColor, "#F87171", "#FBBF24", "#34D399"];
      case "analogous":
        return [baseColor, "#60A5FA", "#818CF8", "#A78BFA"];
      case "monochromatic":
        return [baseColor, "#93C5FD", "#BFDBFE", "#DBEAFE"];
      case "triadic":
        return [baseColor, "#F87171", "#34D399", "#A78BFA"];
      case "tetradic":
        return [baseColor, "#F87171", "#FBBF24", "#34D399"];
      default:
        return [baseColor, "#F87171", "#FBBF24", "#34D399"];
    }
  };

  const currentPalette = generatePalette(selectedScheme, currentBaseColor);

  const handleSavePalette = () => {
    const newPalette: ColorPalette = {
      id: Date.now().toString(),
      name: paletteName,
      colors: currentPalette,
      scheme: selectedScheme,
    };
    onSavePalette(newPalette);
  };

  const handleExport = (format: string) => {
    const paletteToExport: ColorPalette = {
      id: Date.now().toString(),
      name: paletteName,
      colors: currentPalette,
      scheme: selectedScheme,
    };
    onExportPalette(paletteToExport, format);
    setShowExportOptions(false);
  };

  const schemeOptions: ColorScheme[] = [
    "complementary",
    "analogous",
    "monochromatic",
    "triadic",
    "tetradic",
  ];

  return (
    <View className="flex-1 bg-white p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Palette size={24} color="#3B82F6" />
          <Text className="text-2xl font-bold ml-2 text-gray-800">
            Palette Generator
          </Text>
        </View>

        {/* Base Color Selection */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-gray-700">
            Base Color
          </Text>
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: currentBaseColor }}
              className="w-12 h-12 rounded-lg mr-4"
            />
            <TextInput
              value={currentBaseColor}
              onChangeText={setCurrentBaseColor}
              className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-gray-700"
              placeholder="Enter HEX color"
            />
          </View>
        </View>

        {/* Scheme Selection */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-gray-700">
            Color Scheme
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
          >
            {schemeOptions.map((scheme) => (
              <TouchableOpacity
                key={scheme}
                onPress={() => setSelectedScheme(scheme)}
                className={`py-2 px-4 mr-2 rounded-full ${
                  selectedScheme === scheme ? "bg-blue-500" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`${
                    selectedScheme === scheme ? "text-white" : "text-gray-700"
                  } capitalize`}
                >
                  {scheme}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Generated Palette */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-gray-700">
            Generated Palette
          </Text>
          <View className="flex-row mb-4">
            {currentPalette.map((color, index) => (
              <View
                key={index}
                style={{ backgroundColor: color }}
                className="flex-1 h-20 mr-1 last:mr-0 rounded-lg"
              />
            ))}
          </View>
          <View className="flex-row flex-wrap">
            {currentPalette.map((color, index) => (
              <View key={index} className="w-1/2 mb-2 pr-2">
                <Text className="text-gray-700 font-medium">{color}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Palette Name */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-gray-700">
            Palette Name
          </Text>
          <TextInput
            value={paletteName}
            onChangeText={setPaletteName}
            className="h-10 border border-gray-300 rounded-lg px-3 text-gray-700"
            placeholder="Enter palette name"
          />
        </View>

        {/* Actions */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            onPress={handleSavePalette}
            className="flex-row items-center bg-blue-500 py-3 px-5 rounded-lg"
          >
            <Save size={18} color="white" />
            <Text className="text-white font-medium ml-2">Save Palette</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowExportOptions(!showExportOptions)}
            className="flex-row items-center bg-gray-700 py-3 px-5 rounded-lg"
          >
            <Download size={18} color="white" />
            <Text className="text-white font-medium ml-2">Export</Text>
          </TouchableOpacity>
        </View>

        {/* Export Options */}
        {showExportOptions && (
          <View className="mb-6 p-4 bg-gray-100 rounded-lg">
            <Text className="text-lg font-semibold mb-2 text-gray-700">
              Export Format
            </Text>
            <View className="space-y-2">
              <TouchableOpacity
                onPress={() => handleExport("png")}
                className="flex-row items-center py-2 px-3 bg-white rounded-md"
              >
                <Text className="text-gray-700">PNG Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleExport("svg")}
                className="flex-row items-center py-2 px-3 bg-white rounded-md"
              >
                <Text className="text-gray-700">SVG</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleExport("json")}
                className="flex-row items-center py-2 px-3 bg-white rounded-md"
              >
                <Text className="text-gray-700">JSON</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleExport("ase")}
                className="flex-row items-center py-2 px-3 bg-white rounded-md"
              >
                <Text className="text-gray-700">Adobe ASE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Saved Palettes Preview */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-gray-700">
            Saved Palettes
          </Text>
          <View className="bg-gray-100 p-4 rounded-lg">
            {/* Sample saved palette */}
            <View className="mb-4 last:mb-0">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-medium text-gray-700">Website Theme</Text>
                <TouchableOpacity>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View className="flex-row">
                <View className="flex-1 h-8 bg-blue-500 rounded-l-md" />
                <View className="flex-1 h-8 bg-indigo-500" />
                <View className="flex-1 h-8 bg-purple-500" />
                <View className="flex-1 h-8 bg-pink-500 rounded-r-md" />
              </View>
            </View>

            {/* Sample saved palette */}
            <View className="mb-4 last:mb-0">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-medium text-gray-700">
                  Nature Inspired
                </Text>
                <TouchableOpacity>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View className="flex-row">
                <View className="flex-1 h-8 bg-green-600 rounded-l-md" />
                <View className="flex-1 h-8 bg-green-400" />
                <View className="flex-1 h-8 bg-yellow-400" />
                <View className="flex-1 h-8 bg-blue-400 rounded-r-md" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default PaletteGenerator;

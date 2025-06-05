import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import CustomColorPicker from "./CustomColorPicker";
import { Palette, Save, Download, Settings, Edit } from "lucide-react-native";
import {
  hexToRgb,
  rgbToHex,
  rgbObjToHex,
  rgbToHsl,
  hslToRgb,
} from "../utils/convert";

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
  const [paletteSize, setPaletteSize] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(
    null
  );
  const [showSettings, setShowSettings] = useState(false);
  const [pickerColor, setPickerColor] = useState(baseColor);

  // Custom palette colors for individual editing
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [contrast, setContrast] = useState(100); // Advanced color theory algorithms
  const generatePalette = (
    scheme: ColorScheme,
    baseColor: string,
    count: number = 4
  ): string[] => {
    const baseRgb = hexToRgb(baseColor);
    const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
    const colors: string[] = [baseColor];

    switch (scheme) {
      case "complementary":
        // Complementary: 180° apart on color wheel
        for (let i = 1; i < count; i++) {
          const hue = (baseHsl.h + 180) % 360;
          const satVariation = Math.max(20, baseHsl.s - i * 10);
          const lightVariation = Math.max(
            20,
            Math.min(80, baseHsl.l + (i - 1) * 15)
          );
          const complementaryRgb = hslToRgb(hue, satVariation, lightVariation);
          colors.push(
            rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b)
          );
        }
        break;

      case "analogous":
        // Analogous: 30° apart on color wheel
        for (let i = 1; i < count; i++) {
          const hue = (baseHsl.h + i * 30) % 360;
          const satVariation = Math.max(30, baseHsl.s - i * 5);
          const lightVariation = Math.max(
            25,
            Math.min(75, baseHsl.l + (i % 2 === 0 ? 10 : -10))
          );
          const analogousRgb = hslToRgb(hue, satVariation, lightVariation);
          colors.push(rgbToHex(analogousRgb.r, analogousRgb.g, analogousRgb.b));
        }
        break;

      case "monochromatic":
        // Monochromatic: same hue, different saturation/lightness
        for (let i = 1; i < count; i++) {
          const satVariation = Math.max(20, baseHsl.s - i * 20);
          const lightVariation = Math.max(20, Math.min(80, baseHsl.l + i * 20));
          const monoRgb = hslToRgb(baseHsl.h, satVariation, lightVariation);
          colors.push(rgbToHex(monoRgb.r, monoRgb.g, monoRgb.b));
        }
        break;

      case "triadic":
        // Triadic: 120° apart on color wheel
        for (let i = 1; i < count; i++) {
          const hue = (baseHsl.h + i * 120) % 360;
          const satVariation = Math.max(40, baseHsl.s - i * 5);
          const lightVariation = Math.max(
            30,
            Math.min(70, baseHsl.l + (i % 2 === 0 ? 15 : -15))
          );
          const triadicRgb = hslToRgb(hue, satVariation, lightVariation);
          colors.push(rgbToHex(triadicRgb.r, triadicRgb.g, triadicRgb.b));
        }
        break;

      case "tetradic":
        // Tetradic: 90° apart on color wheel
        for (let i = 1; i < count; i++) {
          const hue = (baseHsl.h + i * 90) % 360;
          const satVariation = Math.max(35, baseHsl.s - i * 8);
          const lightVariation = Math.max(
            25,
            Math.min(75, baseHsl.l + (i % 2 === 0 ? 12 : -12))
          );
          const tetradicRgb = hslToRgb(hue, satVariation, lightVariation);
          colors.push(rgbToHex(tetradicRgb.r, tetradicRgb.g, tetradicRgb.b));
        }
        break;

      default:
        // Fallback to complementary
        for (let i = 1; i < count; i++) {
          const hue = (baseHsl.h + 180) % 360;
          const complementaryRgb = hslToRgb(hue, baseHsl.s, baseHsl.l);
          colors.push(
            rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b)
          );
        }
        break;
    }

    return colors.slice(0, count);
  };

  // Apply contrast adjustment to color
  const applyContrast = (color: string, contrastValue: number): string => {
    const rgb = hexToRgb(color);
    const factor = contrastValue / 100;

    const adjustedR = Math.min(
      255,
      Math.max(0, Math.round((rgb.r - 128) * factor + 128))
    );
    const adjustedG = Math.min(
      255,
      Math.max(0, Math.round((rgb.g - 128) * factor + 128))
    );
    const adjustedB = Math.min(
      255,
      Math.max(0, Math.round((rgb.b - 128) * factor + 128))
    );

    return rgbToHex(adjustedR, adjustedG, adjustedB);
  }; // Update color from HSL picker
  const updateColorFromPicker = () => {
    const contrastedColor = applyContrast(pickerColor, contrast);
    setCurrentBaseColor(contrastedColor);
  }; // Handle color change from CustomColorPicker
  const handleColorPickerChange = (color: string) => {
    setPickerColor(color);
  };

  // Handle individual color editing
  const handleEditColor = (index: number) => {
    setEditingColorIndex(index);
    const colorToEdit =
      customColors.length > 0 ? customColors[index] : currentPalette[index];
    setPickerColor(colorToEdit);
    setShowColorPicker(true);
  };

  // Update individual color
  const updateIndividualColor = () => {
    if (editingColorIndex === null) return;

    const contrastedColor = applyContrast(pickerColor, contrast);
    const newCustomColors = [
      ...(customColors.length > 0 ? customColors : currentPalette),
    ];
    newCustomColors[editingColorIndex] = contrastedColor;
    setCustomColors(newCustomColors);
    setShowColorPicker(false);
    setEditingColorIndex(null);
  };
  const currentPalette =
    customColors.length > 0
      ? customColors
      : generatePalette(selectedScheme, currentBaseColor, paletteSize);

  // Reset custom colors when scheme or base color changes
  React.useEffect(() => {
    setCustomColors([]);
  }, [selectedScheme, currentBaseColor, paletteSize]);
  // Update base color from picker when picker color changes
  React.useEffect(() => {
    if (!showColorPicker || editingColorIndex !== null) return;
    updateColorFromPicker();
  }, [pickerColor, contrast, showColorPicker, editingColorIndex]);

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
  const openBaseColorPicker = () => {
    setPickerColor(currentBaseColor);
    setEditingColorIndex(null);
    setShowColorPicker(true);
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
        {" "}
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Palette size={24} color="#3B82F6" />
            <Text className="text-2xl font-bold ml-2 text-gray-800">
              Palette Generator
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            className="bg-gray-100 p-2 rounded-lg"
          >
            <Settings size={20} color="#374151" />
          </TouchableOpacity>
        </View>
        {/* Base Color Selection with Color Picker */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-gray-700">
            Base Color
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={openBaseColorPicker}
              style={{ backgroundColor: currentBaseColor }}
              className="w-12 h-12 rounded-lg mr-4 border-2 border-gray-300"
            />
            <TextInput
              value={currentBaseColor}
              onChangeText={setCurrentBaseColor}
              className="flex-1  border border-gray-300 rounded-lg px-3 text-gray-700"
              placeholder="Enter HEX color"
            />
            <TouchableOpacity
              onPress={openBaseColorPicker}
              className="ml-2 bg-blue-500 px-3 py-2 rounded-lg"
            >
              <Text className="text-white text-sm">Pick</Text>
            </TouchableOpacity>
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
        </View>{" "}
        {/* Generated Palette */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2 text-gray-700">
            Generated Palette ({currentPalette.length} colors)
          </Text>
          <View className="flex-row mb-4">
            {currentPalette.map((color, index) => (
              <View key={index} className="flex-1 mr-1 last:mr-0">
                <TouchableOpacity
                  onPress={() => handleEditColor(index)}
                  style={{ backgroundColor: color }}
                  className="h-20 rounded-lg relative mx-1"
                >
                  <View className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1">
                    <Edit size={12} color="#374151" />
                  </View>
                </TouchableOpacity>
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
            className=" border border-gray-300 rounded-lg px-3 text-gray-700"
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
      </ScrollView>{" "}
      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">
                {editingColorIndex !== null ? "Edit Color" : "Pick Base Color"}
              </Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Text className="text-blue-500 text-lg">Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Color Picker */}
            <CustomColorPicker
              color={pickerColor}
              onColorChange={handleColorPickerChange}
              showPreview={true}
              defaultMode="wheel"
            />

            {/* Action Buttons */}
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setShowColorPicker(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg mr-2"
              >
                <Text className="text-center text-gray-700 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={
                  editingColorIndex !== null
                    ? updateIndividualColor
                    : () => {
                        updateColorFromPicker();
                        setShowColorPicker(false);
                      }
                }
                className="flex-1 bg-blue-500 py-3 rounded-lg ml-2"
              >
                <Text className="text-center text-white font-medium">
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center">
          <View className="bg-white rounded-xl p-6 mx-4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold">Palette Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text className="text-blue-500 text-lg">Done</Text>
              </TouchableOpacity>
            </View>

            {/* Palette Size Setting */}
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2 text-gray-700">
                Palette Size: {paletteSize} colors
              </Text>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={3}
                maximumValue={8}
                step={1}
                value={paletteSize}
                onValueChange={setPaletteSize}
                minimumTrackTintColor="#8B5CF6"
                maximumTrackTintColor="#E5E7EB"
              />
              <View className="flex-row justify-between mt-2">
                <Text className="text-sm text-gray-500">3</Text>
                <Text className="text-sm text-gray-500">8</Text>
              </View>
            </View>

            {/* Reset Custom Colors */}
            <TouchableOpacity
              onPress={() => {
                setCustomColors([]);
                setShowSettings(false);
              }}
              className="bg-red-500 py-3 rounded-lg"
            >
              <Text className="text-center text-white font-medium">
                Reset All Custom Colors
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PaletteGenerator;

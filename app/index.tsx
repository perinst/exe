import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Palette, Camera, BookOpen, Archive } from "lucide-react-native";
import ColorAnalyzer from "./components/ColorAnalyzer";
import PaletteGenerator from "./components/PaletteGenerator";
import ColorLibrary from "./components/ColorLibrary";
import LibraryPackageSelector from "./components/LibraryPackageSelector";
import { LibraryProvider, useLibrary } from "./context/LibraryContext";
import { usePackageSelection } from "./hooks/usePackageSelection";
import Psychology from "./components/Psychology";

type Tab = "analyzer" | "palette" | "library" | "psychology";

export default function HomeScreen() {
  return (
    <LibraryProvider>
      <LibraryPackageSelector>
        <HomeScreenContent />
      </LibraryPackageSelector>
    </LibraryProvider>
  );
}

function HomeScreenContent() {
  const [activeTab, setActiveTab] = useState<Tab>("analyzer");
  const { saveColorWithPackageSelection, savePaletteWithPackageSelection } =
    usePackageSelection();

  const handleSaveColor = (color: string) => {
    saveColorWithPackageSelection(color, undefined, "picker");
  };

  const handleAddToPalette = (color: string) => {
    saveColorWithPackageSelection(color, undefined, "picker");
  };

  const handleSavePalette = (palette: {
    name: string;
    colors: string[];
    scheme?: string;
  }) => {
    savePaletteWithPackageSelection(palette);
  };
  const renderContent = () => {
    switch (activeTab) {
      case "analyzer":
        return (
          <ColorAnalyzer
            onSaveColor={handleSaveColor}
            onAddToPalette={handleAddToPalette}
          />
        );
      case "palette":
        return <PaletteGenerator onSavePalette={handleSavePalette} />;
      case "library":
        return <ColorLibrary />;
      case "psychology":
        return <Psychology />;
      default:
        return <ColorAnalyzer />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-1">
        {/* Header */}
        <View className="p-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-center">
            Color Palette Creator
          </Text>
        </View>

        {/* Main Content */}
        <ScrollView className="flex-1">{renderContent()}</ScrollView>

        {/* Bottom Navigation */}
        <View className="flex-row border-t border-gray-200">
          <TouchableOpacity
            className={`flex-1 py-4 items-center ${
              activeTab === "analyzer" ? "bg-gray-100" : "bg-white"
            }`}
            onPress={() => setActiveTab("analyzer")}
          >
            <Camera
              size={24}
              color={activeTab === "analyzer" ? "#3b82f6" : "#6b7280"}
            />
            <Text
              className={`mt-1 text-xs ${
                activeTab === "analyzer" ? "text-blue-500" : "text-gray-500"
              }`}
            >
              Analyzer
            </Text>
          </TouchableOpacity>{" "}
          <TouchableOpacity
            className={`flex-1 py-4 items-center ${
              activeTab === "palette" ? "bg-gray-100" : "bg-white"
            }`}
            onPress={() => setActiveTab("palette")}
          >
            <Palette
              size={24}
              color={activeTab === "palette" ? "#3b82f6" : "#6b7280"}
            />
            <Text
              className={`mt-1 text-xs ${
                activeTab === "palette" ? "text-blue-500" : "text-gray-500"
              }`}
            >
              Palettes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-4 items-center ${
              activeTab === "library" ? "bg-gray-100" : "bg-white"
            }`}
            onPress={() => setActiveTab("library")}
          >
            <Archive
              size={24}
              color={activeTab === "library" ? "#3b82f6" : "#6b7280"}
            />
            <Text
              className={`mt-1 text-xs ${
                activeTab === "library" ? "text-blue-500" : "text-gray-500"
              }`}
            >
              Library
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-4 items-center ${
              activeTab === "psychology" ? "bg-gray-100" : "bg-white"
            }`}
            onPress={() => setActiveTab("psychology")}
          >
            <BookOpen
              size={24}
              color={activeTab === "psychology" ? "#3b82f6" : "#6b7280"}
            />{" "}
            <Text
              className={`mt-1 text-xs ${
                activeTab === "psychology" ? "text-blue-500" : "text-gray-500"
              }`}
            >
              Psychology
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

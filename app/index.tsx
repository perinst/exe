import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Palette, Camera, Sliders, BookOpen } from "lucide-react-native";
import ColorAnalyzer from "./components/ColorAnalyzer";
import PaletteGenerator from "./components/PaletteGenerator";

type Tab = "analyzer" | "palette" | "psychology" | "settings";

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("analyzer");

  const renderContent = () => {
    switch (activeTab) {
      case "analyzer":
        return <ColorAnalyzer />;
      case "palette":
        return <PaletteGenerator />;
      case "psychology":
        return (
          <View className="flex-1 items-center justify-center p-4 bg-white">
            <Text className="text-xl font-bold mb-4">Color Psychology</Text>
            <Text className="text-base text-center mb-4">
              Learn about the emotional and psychological effects of different
              colors.
            </Text>
            <View className="w-full p-4 rounded-lg bg-gray-100 mb-4">
              <Text className="font-bold mb-2">Red</Text>
              <Text>
                Associated with energy, passion, and excitement. Can increase
                heart rate and create urgency.
              </Text>
            </View>
            <View className="w-full p-4 rounded-lg bg-gray-100 mb-4">
              <Text className="font-bold mb-2">Blue</Text>
              <Text>
                Evokes feelings of calmness, trust, and security. Often used by
                financial institutions.
              </Text>
            </View>
            <View className="w-full p-4 rounded-lg bg-gray-100">
              <Text className="font-bold mb-2">Yellow</Text>
              <Text>
                Represents optimism, clarity, and warmth. Can stimulate mental
                activity and generate energy.
              </Text>
            </View>
          </View>
        );
      case "settings":
        return (
          <View className="flex-1 items-center justify-center p-4 bg-white">
            <Text className="text-xl font-bold mb-4">Settings</Text>
            <View className="w-full p-4 rounded-lg bg-gray-100 mb-4">
              <Text className="font-bold mb-2">App Preferences</Text>
              <Text>Customize your app experience and default settings.</Text>
            </View>
            <View className="w-full p-4 rounded-lg bg-gray-100 mb-4">
              <Text className="font-bold mb-2">Export Settings</Text>
              <Text>Configure default export formats and destinations.</Text>
            </View>
            <View className="w-full p-4 rounded-lg bg-gray-100">
              <Text className="font-bold mb-2">About</Text>
              <Text>Color Palette Creator & Analyzer v1.0</Text>
            </View>
          </View>
        );
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
            className={`flex-1 py-4 items-center ${activeTab === "analyzer" ? "bg-gray-100" : "bg-white"}`}
            onPress={() => setActiveTab("analyzer")}
          >
            <Camera
              size={24}
              color={activeTab === "analyzer" ? "#3b82f6" : "#6b7280"}
            />
            <Text
              className={`mt-1 text-xs ${activeTab === "analyzer" ? "text-blue-500" : "text-gray-500"}`}
            >
              Analyzer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-4 items-center ${activeTab === "palette" ? "bg-gray-100" : "bg-white"}`}
            onPress={() => setActiveTab("palette")}
          >
            <Palette
              size={24}
              color={activeTab === "palette" ? "#3b82f6" : "#6b7280"}
            />
            <Text
              className={`mt-1 text-xs ${activeTab === "palette" ? "text-blue-500" : "text-gray-500"}`}
            >
              Palettes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-4 items-center ${activeTab === "psychology" ? "bg-gray-100" : "bg-white"}`}
            onPress={() => setActiveTab("psychology")}
          >
            <BookOpen
              size={24}
              color={activeTab === "psychology" ? "#3b82f6" : "#6b7280"}
            />
            <Text
              className={`mt-1 text-xs ${activeTab === "psychology" ? "text-blue-500" : "text-gray-500"}`}
            >
              Psychology
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-4 items-center ${activeTab === "settings" ? "bg-gray-100" : "bg-white"}`}
            onPress={() => setActiveTab("settings")}
          >
            <Sliders
              size={24}
              color={activeTab === "settings" ? "#3b82f6" : "#6b7280"}
            />
            <Text
              className={`mt-1 text-xs ${activeTab === "settings" ? "text-blue-500" : "text-gray-500"}`}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

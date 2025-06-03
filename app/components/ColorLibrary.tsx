import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  FolderPlus,
  Package,
  Palette as PaletteIcon,
  Circle,
  Trash2,
  Edit3,
  Star,
  Copy,
  Plus,
  ChevronRight,
  Search,
} from "lucide-react-native";
// import Clipboard from "@react-native-clipboard/clipboard";
import { ColorPackage, SavedColor, SavedPalette } from "../types/library";
import { LibraryStorage } from "../utils/libraryStorage";
import { findNearestColorName } from "../utils/colorList";

const { width } = Dimensions.get("window");
const ITEM_SIZE = (width - 48) / 3; // 3 columns with padding

const ColorLibrary: React.FC = () => {
  const [packages, setPackages] = useState<ColorPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ColorPackage | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePackageModal, setShowCreatePackageModal] = useState(false);
  const [showEditPackageModal, setShowEditPackageModal] = useState(false);
  const [newPackageName, setNewPackageName] = useState("");
  const [newPackageDescription, setNewPackageDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"packages" | "package-detail">(
    "packages"
  );

  const loadPackages = useCallback(async () => {
    try {
      const allPackages = await LibraryStorage.getAllPackages();
      setPackages(allPackages);
    } catch (error) {
      console.error("Error loading packages:", error);
      Alert.alert("Error", "Failed to load your color library");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPackages();
  };

  const createPackage = async () => {
    if (!newPackageName.trim()) {
      Alert.alert("Error", "Please enter a package name");
      return;
    }

    try {
      await LibraryStorage.createPackage(
        newPackageName.trim(),
        newPackageDescription.trim()
      );
      setNewPackageName("");
      setNewPackageDescription("");
      setShowCreatePackageModal(false);
      loadPackages();
    } catch (error) {
      console.error("Error creating package:", error);
      Alert.alert("Error", "Failed to create package");
    }
  };

  const updatePackage = async () => {
    if (!selectedPackage || !newPackageName.trim()) {
      Alert.alert("Error", "Please enter a package name");
      return;
    }

    try {
      await LibraryStorage.updatePackage(selectedPackage.id, {
        name: newPackageName.trim(),
        description: newPackageDescription.trim(),
      });
      setNewPackageName("");
      setNewPackageDescription("");
      setShowEditPackageModal(false);
      loadPackages();
    } catch (error) {
      console.error("Error updating package:", error);
      Alert.alert("Error", "Failed to update package");
    }
  };

  const deletePackage = (pkg: ColorPackage) => {
    if (pkg.isDefault) {
      Alert.alert("Cannot Delete", "The default package cannot be deleted");
      return;
    }

    Alert.alert(
      "Delete Package",
      `Are you sure you want to delete "${pkg.name}"? This will remove all colors and palettes in this package.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await LibraryStorage.deletePackage(pkg.id);
              loadPackages();
            } catch (error) {
              console.error("Error deleting package:", error);
              Alert.alert("Error", "Failed to delete package");
            }
          },
        },
      ]
    );
  };

  const deleteColor = (color: SavedColor, packageId: string) => {
    Alert.alert("Delete Color", "Are you sure you want to delete this color?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await LibraryStorage.deleteColor(color.id, packageId);
            loadPackages();
          } catch (error) {
            console.error("Error deleting color:", error);
            Alert.alert("Error", "Failed to delete color");
          }
        },
      },
    ]);
  };

  const deletePalette = (palette: SavedPalette, packageId: string) => {
    Alert.alert(
      "Delete Palette",
      `Are you sure you want to delete "${palette.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await LibraryStorage.deletePalette(palette.id, packageId);
              loadPackages();
            } catch (error) {
              console.error("Error deleting palette:", error);
              Alert.alert("Error", "Failed to delete palette");
            }
          },
        },
      ]
    );
  };

  const openEditPackageModal = (pkg: ColorPackage) => {
    setSelectedPackage(pkg);
    setNewPackageName(pkg.name);
    setNewPackageDescription(pkg.description || "");
    setShowEditPackageModal(true);
  };
  const copyColorToClipboard = async (color: string) => {
    try {
      //   await Clipboard.setString(color);
      Alert.alert("Color Copied", `Color ${color} copied to clipboard`);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      Alert.alert("Color Copied", `Color ${color} copied to clipboard`);
    }
  };

  const renderColorItem = (color: SavedColor, packageId: string) => {
    const colorName = color.name || findNearestColorName(color.color);

    return (
      <TouchableOpacity
        key={color.id}
        className="mb-4 mr-2"
        style={{ width: ITEM_SIZE }}
        onPress={() => copyColorToClipboard(color.color)}
        onLongPress={() => deleteColor(color, packageId)}
      >
        <View
          className="rounded-lg mb-2 border border-gray-200"
          style={{
            backgroundColor: color.color,
            height: ITEM_SIZE * 0.8,
          }}
        />
        <Text className="text-xs text-gray-600 text-center" numberOfLines={1}>
          {colorName}
        </Text>
        <Text className="text-xs text-gray-400 text-center" numberOfLines={1}>
          {color.color.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPaletteItem = (palette: SavedPalette, packageId: string) => {
    return (
      <TouchableOpacity
        key={palette.id}
        className="mb-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
        onLongPress={() => deletePalette(palette, packageId)}
      >
        <Text className="font-bold text-gray-800 mb-2">{palette.name}</Text>
        {palette.description && (
          <Text className="text-sm text-gray-600 mb-2">
            {palette.description}
          </Text>
        )}
        <View className="flex-row flex-wrap">
          {palette.colors.map((color, index) => (
            <View
              key={index}
              className="w-8 h-8 rounded mr-2 mb-2 border border-gray-200"
              style={{ backgroundColor: color }}
            />
          ))}
        </View>
        <Text className="text-xs text-gray-400 mt-1">
          {palette.colors.length} colors •{" "}
          {new Date(palette.timestamp).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPackageDetail = () => {
    if (!selectedPackage) return null;

    const filteredColors = selectedPackage.colors.filter(
      (color) =>
        searchQuery === "" ||
        color.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (color.name &&
          color.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredPalettes = selectedPackage.palettes.filter(
      (palette) =>
        searchQuery === "" ||
        palette.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (palette.description &&
          palette.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              onPress={() => {
                setViewMode("packages");
                setSelectedPackage(null);
              }}
              className="flex-row items-center"
            >
              <Text className="text-lg font-bold text-gray-800">
                ← {selectedPackage.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openEditPackageModal(selectedPackage)}
            >
              <Edit3 size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          {selectedPackage.description && (
            <Text className="text-sm text-gray-600">
              {selectedPackage.description}
            </Text>
          )}
          <Text className="text-xs text-gray-400 mt-1">
            {selectedPackage.colors.length} colors •{" "}
            {selectedPackage.palettes.length} palettes
          </Text>
        </View>

        {/* Search */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search size={16} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-800"
              placeholder="Search colors and palettes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Colors Section */}
        {filteredColors.length > 0 && (
          <View className="bg-white p-4 mb-2">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Colors ({filteredColors.length})
            </Text>
            <View className="flex-row flex-wrap">
              {filteredColors.map((color) =>
                renderColorItem(color, selectedPackage.id)
              )}
            </View>
          </View>
        )}

        {/* Palettes Section */}
        {filteredPalettes.length > 0 && (
          <View className="bg-white p-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Palettes ({filteredPalettes.length})
            </Text>
            {filteredPalettes.map((palette) =>
              renderPaletteItem(palette, selectedPackage.id)
            )}
          </View>
        )}

        {/* Empty State */}
        {filteredColors.length === 0 && filteredPalettes.length === 0 && (
          <View className="flex-1 items-center justify-center p-8">
            <PaletteIcon size={48} color="#d1d5db" />
            <Text className="text-lg font-medium text-gray-500 mt-4">
              {searchQuery
                ? "No matching items found"
                : "No colors or palettes yet"}
            </Text>
            <Text className="text-sm text-gray-400 text-center mt-2">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Use the Analyzer and Palette tabs to save colors and palettes"}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderPackagesList = () => {
    const filteredPackages = packages.filter(
      (pkg) =>
        searchQuery === "" ||
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.description &&
          pkg.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl font-bold text-gray-800">
              Color Library
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreatePackageModal(true)}
              className="bg-blue-500 rounded-full p-2"
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-600">
            Organize your colors and palettes into collections
          </Text>
        </View>

        {/* Search */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search size={16} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-800"
              placeholder="Search packages..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Packages List */}
        <View className="p-4">
          {filteredPackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              className="bg-white p-4 mb-3 rounded-lg border border-gray-200 shadow-sm"
              onPress={() => {
                setSelectedPackage(pkg);
                setViewMode("package-detail");
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Package size={16} color="#6b7280" />
                    <Text className="font-bold text-gray-800 ml-2">
                      {pkg.name}
                    </Text>
                    {pkg.isDefault && (
                      <View className="bg-blue-100 px-2 py-1 rounded ml-2">
                        <Text className="text-xs text-blue-600">Default</Text>
                      </View>
                    )}
                  </View>
                  {pkg.description && (
                    <Text className="text-sm text-gray-600 mb-2">
                      {pkg.description}
                    </Text>
                  )}
                  <Text className="text-xs text-gray-400">
                    {pkg.colors.length} colors • {pkg.palettes.length} palettes
                  </Text>
                </View>
                <View className="flex-row items-center">
                  {!pkg.isDefault && (
                    <TouchableOpacity
                      onPress={() => deletePackage(pkg)}
                      className="p-2 mr-2"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                  <ChevronRight size={16} color="#6b7280" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {filteredPackages.length === 0 && (
          <View className="flex-1 items-center justify-center p-8">
            <Package size={48} color="#d1d5db" />
            <Text className="text-lg font-medium text-gray-500 mt-4">
              {searchQuery ? "No matching packages found" : "No packages yet"}
            </Text>
            <Text className="text-sm text-gray-400 text-center mt-2">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create your first package to organize your colors"}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <PaletteIcon size={48} color="#d1d5db" />
        <Text className="text-lg font-medium text-gray-500 mt-4">
          Loading your library...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {viewMode === "packages" ? renderPackagesList() : renderPackageDetail()}

      {/* Create Package Modal */}
      <Modal
        visible={showCreatePackageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreatePackageModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Create New Package
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Package Name
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
              placeholder="Enter package name"
              value={newPackageName}
              onChangeText={setNewPackageName}
              autoFocus
            />

            {/* <Text className="text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-6 text-gray-800"
              placeholder="Enter description"
              value={newPackageDescription}
              onChangeText={setNewPackageDescription}
              multiline
              numberOfLines={3}
            /> */}

            <View className="flex-row justify-between space-x-5">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-3 max-w-[35%]"
                onPress={() => setShowCreatePackageModal(false)}
              >
                <Text className="text-center font-medium text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg py-3 max-w-[35%]"
                onPress={createPackage}
              >
                <Text className="text-center font-medium text-white">
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Package Modal */}
      <Modal
        visible={showEditPackageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditPackageModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Edit Package
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Package Name
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
              placeholder="Enter package name"
              value={newPackageName}
              onChangeText={setNewPackageName}
              autoFocus
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-6 text-gray-800"
              placeholder="Enter description"
              value={newPackageDescription}
              onChangeText={setNewPackageDescription}
              multiline
              numberOfLines={3}
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-3"
                onPress={() => setShowEditPackageModal(false)}
              >
                <Text className="text-center font-medium text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-lg py-3"
                onPress={updatePackage}
              >
                <Text className="text-center font-medium text-white">
                  Update
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ColorLibrary;

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Package, Check, X } from "lucide-react-native";
import { ColorPackage } from "../types/library";
import { LibraryStorage } from "../utils/libraryStorage";

interface PackageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectPackage: (packageId: string) => void;
  title?: string;
  subtitle?: string;
}

const PackageSelector: React.FC<PackageSelectorProps> = ({
  visible,
  onClose,
  onSelectPackage,
  title = "Select Package",
  subtitle = "Choose where to save this item",
}) => {
  const [packages, setPackages] = useState<ColorPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    try {
      setLoading(true);

      const allPackages = await LibraryStorage.getAllPackages();

      const defaultPackage = await LibraryStorage.getDefaultPackage();

      setPackages(allPackages);
      setSelectedPackageId(defaultPackage?.id || allPackages[0]?.id || null);
    } catch (error) {
      console.error("Error loading packages:", error);
      Alert.alert("Error", "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = () => {
    if (selectedPackageId) {
      onSelectPackage(selectedPackageId);
      onClose();
    } else {
      Alert.alert("Error", "Please select a package");
    }
  };

  const handleCancel = () => {
    onClose();
  };
  if (loading)
    return (
      <View className="py-8 items-center">
        <Text className="text-gray-500">Loading packages...</Text>
      </View>
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">{title}</Text>
              <Text className="text-sm text-gray-600 mt-1">{subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={handleCancel}
              className="p-2 rounded-full bg-gray-100"
            >
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {packages.length === 0 ? (
            <View className="py-8 items-center">
              <Package size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-2">No packages available</Text>
              <Text className="text-sm text-gray-400 text-center mt-1">
                Create a package first to organize your colors
              </Text>
            </View>
          ) : (
            <>
              {packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  className={`p-4 mb-2 rounded-lg border ${
                    selectedPackageId === pkg.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                  onPress={() => setSelectedPackageId(pkg.id)}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Package size={16} color="#6b7280" />
                        <Text className="font-medium text-gray-800 ml-2">
                          {pkg.name}
                        </Text>
                        {pkg.isDefault && (
                          <View className="bg-blue-100 px-2 py-1 rounded ml-2">
                            <Text className="text-xs text-blue-600">
                              Default
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-xs text-gray-400">
                        {pkg.colors.length} colors • {pkg.palettes.length}{" "}
                        palettes
                      </Text>
                    </View>
                    {selectedPackageId === pkg.id && (
                      <Check size={20} color="#3b82f6" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Action Buttons */}
          {packages.length > 0 && (
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className={`flex-1 rounded-lg py-3 ${
                  selectedPackageId ? "bg-blue-500" : "bg-gray-300"
                }`}
                onPress={handleSelectPackage}
                disabled={!selectedPackageId}
              >
                <Text
                  className={`text-center font-medium ${
                    selectedPackageId ? "text-white" : "text-gray-500"
                  }`}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PackageSelector;

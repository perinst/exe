import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from "react-native";
import {
  Camera as CameraIcon,
  Image as ImageIcon,
  ImageUpload,
  Palette,
  X,
} from "lucide-react-native";
import { Camera } from "expo-camera";
import ColorDetails from "./ColorDetails";
import ColorWheel from "./ColorWheel";

type ColorSource = "camera" | "gallery" | "picker";

interface ColorAnalyzerProps {
  onSaveColor?: (color: string) => void;
  onAddToPalette?: (color: string) => void;
  initialColor?: string;
}

export default function ColorAnalyzer({
  onSaveColor = () => {},
  onAddToPalette = () => {},
  initialColor = "#4287f5",
}: ColorAnalyzerProps) {
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);
  const [activeSource, setActiveSource] = useState<ColorSource | null>(null);

  // Mock function to simulate color selection from different sources
  const selectColorFromSource = (source: ColorSource) => {
    setActiveSource(source);
    // In a real implementation, this would trigger camera/gallery/picker
    // For now, we'll just simulate with some preset colors
    const mockColors = {
      camera: "#e74c3c",
      gallery: "#2ecc71",
      picker: "#9b59b6",
    };

    setTimeout(() => {
      setSelectedColor(mockColors[source]);
      setActiveSource(null); // Reset active source after "selection"
    }, 1000);
  };

  // Function to extract dominant color from an image
  const extractColorFromImage = async (imageUri: string) => {
    setAnalyzing(true);
    try {
      // In a real implementation, you would use image processing libraries
      // For this demo, we'll simulate color extraction with a timeout
      // and random color generation to mimic processing
      setTimeout(() => {
        // Generate a random color for demonstration
        const randomColor =
          "#" + Math.floor(Math.random() * 16777215).toString(16);
        setSelectedColor(randomColor);
        setAnalyzing(false);
      }, 1500);

      // In a production app, you would use something like:
      // const result = await processImageForColor(imageUri);
      // setSelectedColor(result.dominantColor);
    } catch (error) {
      console.error("Error extracting color:", error);
      setAnalyzing(false);
    }
  };

  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = React.useRef(null);

  // Function to handle taking a photo
  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setShowCamera(false);
        extractColorFromImage(photo.uri);
      } catch (error) {
        console.error("Error taking picture:", error);
        setShowCamera(false);
        setActiveSource(null);
      }
    }
  };

  // Function to handle real-time color analysis
  const analyzeFrameInRealTime = () => {
    // In a real implementation, you would use frame processors
    // For this demo, we'll simulate with a random color
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    setSelectedColor(randomColor);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6 text-center">
          Color Analyzer
        </Text>

        {/* Color Source Selection */}
        <View className="flex-row justify-around mb-8">
          <TouchableOpacity
            className={`items-center p-3 rounded-lg ${activeSource === "camera" ? "bg-blue-100" : "bg-gray-100"}`}
            onPress={() => selectColorFromSource("camera")}
          >
            <CameraIcon size={24} color="#0f172a" />
            <Text className="mt-2 text-sm">Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`items-center p-3 rounded-lg ${activeSource === "gallery" ? "bg-blue-100" : "bg-gray-100"}`}
            onPress={() => selectColorFromSource("gallery")}
          >
            <ImageIcon size={24} color="#0f172a" />
            <Text className="mt-2 text-sm">Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`items-center p-3 rounded-lg ${activeSource === "picker" ? "bg-blue-100" : "bg-gray-100"}`}
            onPress={() => selectColorFromSource("picker")}
          >
            <Palette size={24} color="#0f172a" />
            <Text className="mt-2 text-sm">Color Picker</Text>
          </TouchableOpacity>
        </View>

        {/* Color Preview */}
        <View className="items-center mb-6">
          <View
            style={{ backgroundColor: selectedColor }}
            className="w-32 h-32 rounded-full shadow-md"
          />
          <Text className="mt-2 text-lg font-medium">
            {selectedColor.toUpperCase()}
          </Text>
          {analyzing && (
            <Text className="mt-2 text-sm text-gray-500">
              Analyzing image...
            </Text>
          )}
        </View>

        {/* Color Details Component */}
        <View className="mb-6">
          <ColorDetails color={selectedColor} />
        </View>

        {/* Color Wheel Component */}
        <View className="mb-6 items-center">
          <ColorWheel
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-around mt-4 mb-8">
          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-lg"
            onPress={() => onSaveColor(selectedColor)}
          >
            <Text className="text-white font-medium">Save Color</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-purple-500 px-6 py-3 rounded-lg"
            onPress={() => onAddToPalette(selectedColor)}
          >
            <Text className="text-white font-medium">Add to Palette</Text>
          </TouchableOpacity>
        </View>

        {/* Camera Modal */}
        <Modal visible={showCamera} animationType="slide">
          <View style={styles.cameraContainer}>
            {hasCameraPermission ? (
              <>
                <Camera
                  ref={cameraRef}
                  style={styles.camera}
                  onCameraReady={() => setIsCameraReady(true)}
                  onMountError={(error) =>
                    console.error("Camera mount error:", error)
                  }
                />
                <View style={styles.cameraControls}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setShowCamera(false);
                      setActiveSource(null);
                    }}
                  >
                    <X size={24} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={takePicture}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.analyzeButton}
                    onPress={analyzeFrameInRealTime}
                  >
                    <Text style={styles.analyzeButtonText}>Analyze</Text>
                  </TouchableOpacity>
                </View>

                {/* Color preview overlay */}
                <View style={styles.colorPreview}>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: selectedColor },
                    ]}
                  />
                  <Text style={styles.colorText}>
                    {selectedColor.toUpperCase()}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noCameraAccess}>
                <Text>No access to camera</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowCamera(false);
                    setActiveSource(null);
                  }}
                >
                  <X size={24} color="black" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  analyzeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  colorPreview: {
    position: "absolute",
    top: 40,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  colorText: {
    color: "white",
    fontWeight: "bold",
  },
  noCameraAccess: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
});

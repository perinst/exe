import React, { useState, useEffect, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import ColorDetails from "./ColorDetails";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image as RNImage,
  Dimensions,
  Alert,
  LayoutChangeEvent,
  ActivityIndicator,
} from "react-native";

import {
  Camera as CameraIcon,
  Image as ImageIcon,
  Palette,
  X,
  RotateCcw,
  Plus,
} from "lucide-react-native";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToCmyk,
  rgbToYuv,
  rgbToLab,
  rgbToRyb,
  type RGB,
  type HSL,
  type HSV,
  type CMYK,
  type YUV,
  type Lab,
  type RYB,
} from "../utils/convert";

import { findNearestColorName } from "../utils/colorList";

import { SkiaColorExtractor } from "../utils/skiaColorExtractor";

type ColorSource = "camera" | "gallery" | "picker";

interface ColorAnalyzerProps {
  onSaveColor?: (color: string) => void;
  onAddToPalette?: (color: string) => void;
}
const DEFAULT_COLOR = "#91E3A5";

export default function ColorAnalyzer({
  onSaveColor = () => {},
  onAddToPalette = () => {},
}: ColorAnalyzerProps) {
  const [selectedColor, setSelectedColor] = useState<string>("#91E3A5");
  const [selectedColorName, setSelectedColorName] = useState<string>("");
  const [activeSource, setActiveSource] = useState<ColorSource | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 0, y: 0 });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [displayImageDimensions, setDisplayImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imageViewLayout, setImageViewLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [colorConversions, setColorConversions] = useState<{
    rgb: RGB;
    hsl: HSL;
    hsv: HSV;
    cmyk: CMYK;
    yuv: YUV;
    lab: Lab;
    ryb: RYB;
  } | null>(null);

  const cameraRef = React.useRef<CameraView | null>(null);
  const imageRef = useRef<RNImage>(null);
  // Check if we have camera permission
  useEffect(() => {
    (async () => {
      if (permission) {
        setActiveSource(permission.granted ? activeSource : null);
      }
    })();
  }, [permission]);
  // Update color conversions when selectedColor changes
  useEffect(() => {
    if (selectedColor && selectedColor !== "") {
      const rgb = hexToRgb(selectedColor);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
      const yuv = rgbToYuv(rgb.r, rgb.g, rgb.b);
      const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
      const ryb = rgbToRyb(rgb.r, rgb.g, rgb.b);

      setColorConversions({
        rgb,
        hsl,
        hsv,
        cmyk,
        yuv,
        lab,
        ryb,
      });

      // Find and set the nearest color name
      const colorName = findNearestColorName(selectedColor, "en");
      setSelectedColorName(colorName);
    }
  }, [selectedColor]);
  // Initialize crosshair position to center
  useEffect(() => {
    const { width } = Dimensions.get("window");
    setCrosshairPosition({ x: width / 2, y: 200 });
  }, []);

  // Cleanup Skia image cache when component unmounts
  useEffect(() => {
    return () => {
      SkiaColorExtractor.clearCache();
    };
  }, []);

  // Select color from source
  const selectColorFromSource = async (source: ColorSource) => {
    setActiveSource(source);

    switch (source) {
      case "camera":
        if (permission?.granted) {
          setShowCamera(true);
        } else {
          const permissionResult = await requestPermission();
          if (permissionResult.granted) {
            setShowCamera(true);
          } else {
            Alert.alert(
              "Permission Required",
              "Camera permission is required to use this feature."
            );
          }
        }
        break;

      case "gallery":
        await pickImageFromGallery();
        break;

      case "picker":
        // Color picker is handled by the ColorWheel component
        break;
    }
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required to select images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setImageUri(imageUri);
        setCapturedImage(imageUri);
        await processImageForColorPicking(imageUri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image from gallery.");
    }
  };

  // Take picture with camera
  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert(
        "Camera not ready",
        "Please wait for the camera to initialize."
      );
      return;
    }

    try {
      setAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });

      if (photo) {
        setCapturedImage(photo.uri);
        setImageUri(photo.uri);
        await processImageForColorPicking(photo.uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture.");
    } finally {
      setAnalyzing(false);
    }
  };
  // Process image for color picking using Skia
  const processImageForColorPicking = async (uri: string) => {
    try {
      setAnalyzing(true);

      // Get original image dimensions using Skia
      const imageDimensions = await SkiaColorExtractor.getImageDimensions(uri);

      if (!imageDimensions) {
        throw new Error("Failed to get image dimensions using Skia");
      }

      // Store original dimensions
      setOriginalImageDimensions({
        width: imageDimensions.width,
        height: imageDimensions.height,
      });

      // Calculate display dimensions while maintaining aspect ratio
      const maxDisplayWidth = Math.min(
        400,
        Dimensions.get("window").width - 32
      );
      const aspectRatio = imageDimensions.height / imageDimensions.width;
      const displayWidth = maxDisplayWidth;
      const displayHeight = displayWidth * aspectRatio;

      setDisplayImageDimensions({
        width: displayWidth,
        height: displayHeight,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("Error", "Failed to process image for color picking.");
    } finally {
      setAnalyzing(false);
    }
  };

  //Handle image layout with proper bounds tracking
  function handleImageLayout(event: LayoutChangeEvent): void {
    const { layout } = event.nativeEvent;
    setImageViewLayout({
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
    });
  }

  // Handle image touch with accurate coordinate mapping
  const handleImageTouch = async (event: any) => {
    const { locationX, locationY } = event.nativeEvent;

    // Update crosshair position (relative to the image view)
    setCrosshairPosition({ x: locationX, y: locationY });

    // Validate we have all required dimensions
    if (
      !originalImageDimensions.width ||
      !originalImageDimensions.height ||
      !imageViewLayout.width ||
      !imageViewLayout.height
    ) {
      console.log("Missing required dimensions for coordinate mapping");
      return;
    }

    // Calculate accurate scaling factors
    // The image is displayed with "contain" resize mode, so we need to account for letterboxing
    const imageAspectRatio =
      originalImageDimensions.width / originalImageDimensions.height;
    const viewAspectRatio = imageViewLayout.width / imageViewLayout.height;

    let actualImageWidth, actualImageHeight, offsetX, offsetY;

    if (imageAspectRatio > viewAspectRatio) {
      // Image is wider relative to view - letterboxed top/bottom
      actualImageWidth = imageViewLayout.width;
      actualImageHeight = imageViewLayout.width / imageAspectRatio;
      offsetX = 0;
      offsetY = (imageViewLayout.height - actualImageHeight) / 2;
    } else {
      // Image is taller relative to view - letterboxed left/right
      actualImageWidth = imageViewLayout.height * imageAspectRatio;
      actualImageHeight = imageViewLayout.height;
      offsetX = (imageViewLayout.width - actualImageWidth) / 2;
      offsetY = 0;
    }

    // Check if touch is within the actual image bounds
    if (
      locationX < offsetX ||
      locationX > offsetX + actualImageWidth ||
      locationY < offsetY ||
      locationY > offsetY + actualImageHeight
    ) {
      console.log("Touch outside image bounds");
      return;
    }

    // Map touch coordinates to image coordinates
    const relativeX = locationX - offsetX;
    const relativeY = locationY - offsetY;

    const scaleX = originalImageDimensions.width / actualImageWidth;
    const scaleY = originalImageDimensions.height / actualImageHeight;

    const imageX = Math.floor(relativeX * scaleX);
    const imageY = Math.floor(relativeY * scaleY);

    // Clamp coordinates to image bounds
    const clampedX = Math.max(
      0,
      Math.min(imageX, originalImageDimensions.width - 1)
    );
    const clampedY = Math.max(
      0,
      Math.min(imageY, originalImageDimensions.height - 1)
    );

    // console.log(
    //   `Touch: (${locationX.toFixed(1)}, ${locationY.toFixed(1)}) -> ` +
    //     `Relative: (${relativeX.toFixed(1)}, ${relativeY.toFixed(1)}) -> ` +
    //     `Image: (${clampedX}, ${clampedY})`
    // );
    // console.log(
    //   `Scale factors: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`
    // );
    try {
      setAnalyzing(true);

      // Extract color using accurate pixel reading with region averaging for better results
      const pixelColor = await getColorAtPixel(clampedX, clampedY);
      // Also try to get average color from a small region for more stable results
      let regionColor = null;
      if (imageUri) {
        regionColor = await SkiaColorExtractor.extractRegionAverageColor(
          imageUri,
          clampedX,
          clampedY,
          2 // 2-pixel radius for sampling
        );
      }

      // Use region color if available, otherwise fall back to pixel color
      const finalColor = regionColor || pixelColor;

      if (finalColor && finalColor.r !== undefined) {
        const hexColor = rgbToHex(finalColor.r, finalColor.g, finalColor.b);
        setSelectedColor(hexColor);

        // console.log(
        //   `Extracted color: ${hexColor} from RGB(${finalColor.r}, ${
        //     finalColor.g
        //   }, ${finalColor.b}) using ${
        //     regionColor ? "region averaging" : "pixel sampling"
        //   }`
        // );
      } else {
        console.log("Failed to extract color at coordinates");
      }
    } catch (error) {
      console.error("Error extracting color:", error);
    } finally {
      setAnalyzing(false);
    }
  };
  //Accurate pixel color extraction using Skia
  const getColorAtPixel = async (
    x: number,
    y: number
  ): Promise<{ r: number; g: number; b: number; a: number } | null> => {
    if (
      !imageUri ||
      !originalImageDimensions.width ||
      !originalImageDimensions.height
    ) {
      console.log("No image URI or dimensions available for pixel extraction");
      return null;
    }

    // Validate coordinates
    if (
      x < 0 ||
      x >= originalImageDimensions.width ||
      y < 0 ||
      y >= originalImageDimensions.height
    ) {
      // console.log(`Coordinates out of bounds: (${x}, ${y})`);
      return null;
    }
    try {
      // Use Skia-based color extraction for better accuracy and performance
      if (!imageUri) {
        // console.log("No image URI available for Skia extraction");
        return null;
      }

      const color = await SkiaColorExtractor.getColorAtPixel(imageUri, x, y);

      if (color) {
        // console.log(
        //   `SkiaColorExtractor result at (${x}, ${y}): RGB(${color.r}, ${color.g}, ${color.b})`
        // );
        return { ...color, a: color.a || 255 };
      }

      return null;
    } catch (error) {
      console.error("Error in getColorAtPixel:", error);
      return null;
    }
  };
  const analyzeFrameInRealTime = async () => {
    try {
      if (!cameraRef.current || !isCameraReady) {
        Alert.alert(
          "Camera not ready",
          "Please wait for camera to initialize."
        );
        return;
      }

      setAnalyzing(true);

      // Take a picture for analysis
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false, // Keep processing for better quality
      });

      if (photo) {
        // Get image dimensions using Skia
        const imageDimensions = await SkiaColorExtractor.getImageDimensions(
          photo.uri
        );

        if (!imageDimensions) {
          console.log("Failed to get image dimensions using Skia");
          return;
        }

        // Extract color at center of the image using Skia
        const color = await SkiaColorExtractor.extractCenterColor(photo.uri);

        if (color) {
          const hexColor = rgbToHex(color.r, color.g, color.b);
          setSelectedColor(hexColor);

          // console.log(
          //   `Real-time Skia analysis at center: ${hexColor} from RGB(${color.r}, ${color.g}, ${color.b})`
          // );
        } else {
          console.log("Failed to extract color from camera frame using Skia");
        }
      }
    } catch (error) {
      console.error("Error in real-time analysis:", error);
      Alert.alert("Analysis Error", "Failed to analyze camera frame.");
    } finally {
      setAnalyzing(false);
    }
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
            className={`items-center p-3 rounded-lg ${
              activeSource === "camera" ? "bg-blue-100" : "bg-gray-100"
            }`}
            onPress={() => selectColorFromSource("camera")}
          >
            <CameraIcon size={24} color="#0f172a" />
            <Text className="mt-2 text-sm">Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`items-center p-3 rounded-lg ${
              activeSource === "gallery" ? "bg-blue-100" : "bg-gray-100"
            }`}
            onPress={() => selectColorFromSource("gallery")}
          >
            <ImageIcon size={24} color="#0f172a" />
            <Text className="mt-2 text-sm">Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`items-center p-3 rounded-lg ${
              activeSource === "picker" ? "bg-blue-100" : "bg-gray-100"
            }`}
            onPress={() => selectColorFromSource("picker")}
          >
            <Palette size={24} color="#0f172a" />
            <Text className="mt-2 text-sm">Color Picker</Text>
          </TouchableOpacity>
        </View>{" "}
        {/* Color Preview */}
        <View className="items-center mb-2">
          <View
            style={{ backgroundColor: selectedColor }}
            className="w-16 h-16 rounded-full shadow-md"
          />
          <Text className="mt-2 text-lg font-medium">
            {selectedColor.toUpperCase()}
          </Text>
        </View>
        {/* Captured Image with Color Picker */}
        {capturedImage && (
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2">
              Tap on the image to pick a color
            </Text>
            <View className="relative" style={{ alignSelf: "center" }}>
              <TouchableOpacity
                onPress={handleImageTouch}
                activeOpacity={1}
                disabled={analyzing}
              >
                <RNImage
                  ref={imageRef}
                  source={{ uri: capturedImage }}
                  style={{
                    width: displayImageDimensions.width,
                    height: displayImageDimensions.height,
                    borderRadius: 8,
                    backgroundColor: "#f0f0f0",
                    opacity: analyzing ? 0.7 : 1,
                  }}
                  resizeMode="contain"
                  onLayout={handleImageLayout}
                />
              </TouchableOpacity>

              {/* Loading overlay for image analysis */}
              {analyzing && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 8,
                  }}
                >
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="text-white font-medium mt-2">
                    Analyzing...
                  </Text>
                </View>
              )}

              {/* Crosshair overlay */}
              {!analyzing && (
                <View
                  style={{
                    position: "absolute",
                    left: crosshairPosition.x - 25,
                    top: crosshairPosition.y - 25,
                    width: 50,
                    height: 50,
                    justifyContent: "center",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Plus size={30} color="#ece6e6" strokeWidth={3} />
                </View>
              )}

              {/* Color preview at touch point */}
              {!analyzing && (
                <View
                  style={{
                    position: "absolute",
                    left: Math.min(
                      crosshairPosition.x + 20,
                      displayImageDimensions.width - 60
                    ),
                    top: Math.max(crosshairPosition.y - 40, 0),
                    backgroundColor: selectedColor,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: "white",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                    pointerEvents: "none",
                  }}
                />
              )}
            </View>{" "}
            {/* Image and touch debug info */}
            <View className="mt-2 p-2 bg-gray-100 rounded">
              <Text className="text-xs text-gray-600">
                Original: {originalImageDimensions.width}×
                {originalImageDimensions.height}
              </Text>
              <Text className="text-xs text-gray-600">
                Display: {displayImageDimensions.width.toFixed(0)}×
                {displayImageDimensions.height.toFixed(0)}
              </Text>
              <Text className="text-xs text-gray-600">
                View Layout: {imageViewLayout.width.toFixed(0)}×
                {imageViewLayout.height.toFixed(0)}
              </Text>
              <Text className="text-xs text-gray-600">
                Touch: ({crosshairPosition.x.toFixed(0)},{" "}
                {crosshairPosition.y.toFixed(0)})
              </Text>
            </View>{" "}
            <View className="flex-row justify-center space-x-2 mt-2">
              <TouchableOpacity
                className="bg-gray-500 px-4 py-2 rounded-lg"
                onPress={() => {
                  setCapturedImage(null);
                  setImageUri(null);
                  setOriginalImageDimensions({ width: 0, height: 0 });
                  setDisplayImageDimensions({ width: 0, height: 0 });
                  setImageViewLayout({ x: 0, y: 0, width: 0, height: 0 });
                }}
              >
                <Text className="text-white font-medium">Clear Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Color Details Component */}
        <View className="mb-6">
          <ColorDetails
            color={selectedColor}
            rgbValues={colorConversions?.rgb}
            hslValues={colorConversions?.hsl}
            cmykValues={colorConversions?.cmyk}
            rybValues={colorConversions?.ryb}
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

          {/* <TouchableOpacity
            className="bg-purple-500 px-6 py-3 rounded-lg"
            onPress={() => onAddToPalette(selectedColor)}
          >
            <Text className="text-white font-medium">Add to Palette</Text>
          </TouchableOpacity> */}
        </View>{" "}
        {/* Camera Modal */}
        <Modal visible={showCamera} animationType="slide">
          <View style={styles.cameraContainer}>
            {permission?.granted ? (
              <>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing={cameraFacing}
                  onCameraReady={() => setIsCameraReady(true)}
                />

                {/* Camera UI Overlay */}
                <View style={styles.cameraOverlay}>
                  {/* Loading overlay for camera analysis */}
                  {analyzing && (
                    <View style={styles.cameraLoadingOverlay}>
                      <ActivityIndicator size="large" color="#ffffff" />
                      <Text style={styles.cameraLoadingText}>
                        Analyzing camera frame...
                      </Text>
                    </View>
                  )}
                  {/* Center crosshair for real-time analysis */}
                  {!analyzing && (
                    <View style={styles.centerCrosshair}>
                      <Plus size={50} color="white" strokeWidth={2} />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setShowCamera(false);
                      setActiveSource(null);
                    }}
                    disabled={analyzing}
                  >
                    <X size={24} color="white" />
                  </TouchableOpacity>
                  {/* Color name display - positioned between color code and close button */}
                  {!analyzing && selectedColorName && (
                    <View style={styles.colorNameContainer}>
                      <Text style={styles.colorNameText}>
                        {selectedColorName}
                      </Text>
                    </View>
                  )}
                  {/* Color preview overlay */}
                  {!analyzing && (
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
                  )}
                  <View style={styles.cameraControls}>
                    <TouchableOpacity
                      style={[
                        styles.captureButton,
                        { opacity: analyzing ? 0.5 : 1 },
                      ]}
                      onPress={takePicture}
                      disabled={analyzing}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.analyzeButton,
                        { opacity: analyzing ? 0.5 : 1 },
                      ]}
                      onPress={analyzeFrameInRealTime}
                      disabled={analyzing}
                    >
                      <Text style={styles.analyzeButtonText}>
                        {analyzing ? "Analyzing..." : "Analyze"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.noCameraAccess}>
                <Text>No access to camera</Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionButtonText}>
                    Grant Permission
                  </Text>
                </TouchableOpacity>
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
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
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
  flipButton: {
    position: "absolute",
    top: 40,
    left: 70,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
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
  colorNameContainer: {
    position: "absolute",
    top: 90,
    left: 20,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignItems: "center",
  },
  colorNameText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  noCameraAccess: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  centerCrosshair: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -20,
    marginLeft: -20,
    pointerEvents: "none",
  },
  cameraLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  cameraLoadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
});

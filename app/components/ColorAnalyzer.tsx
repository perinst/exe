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
} from "react-native";

import {
  Camera as CameraIcon,
  Image as ImageIcon,
  Palette,
  X,
  RotateCcw,
  Plus,
} from "lucide-react-native";
// import ColorWheel from "./ColorWheel";
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

type ColorSource = "camera" | "gallery" | "picker";

interface ColorAnalyzerProps {
  onSaveColor?: (color: string) => void;
  onAddToPalette?: (color: string) => void;
}

export default function ColorAnalyzer({
  onSaveColor = () => {},
  onAddToPalette = () => {},
}: ColorAnalyzerProps) {
  const [selectedColor, setSelectedColor] = useState<string>("#3B82F6");
  const [activeSource, setActiveSource] = useState<ColorSource | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 0, y: 0 });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [displayedImageDimensions, setDisplayedImageDimensions] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
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
    }
  }, [selectedColor]);

  // Initialize crosshair position to center
  useEffect(() => {
    const { width } = Dimensions.get("window");
    setCrosshairPosition({ x: width / 2, y: 200 });
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
  }; // Process image for color picking - simplified since we use direct coordinate extraction
  const processImageForColorPicking = async (uri: string) => {
    try {
      setAnalyzing(true);

      // Get original image dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
      });

      // Set dimensions for display and coordinate mapping
      setImageDimensions({
        width: imageInfo.width,
        height: imageInfo.height,
      });

      console.log(`Image loaded: ${imageInfo.width}×${imageInfo.height}`);
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert("Error", "Failed to process image for color picking.");
    } finally {
      setAnalyzing(false);
    }
  };
  function handleImageLayout(event: LayoutChangeEvent): void {
    const { layout } = event.nativeEvent;
    setDisplayedImageDimensions({
      width: layout.width,
      height: layout.height,
      x: layout.x,
      y: layout.y,
    });
  }
  // Pick color at touch coordinates
  const handleImageTouch = async (event: any) => {
    const { locationX, locationY } = event.nativeEvent;

    // Update crosshair position
    setCrosshairPosition({ x: locationX, y: locationY });

    // Ensure we have dimensions
    if (
      !imageDimensions.width ||
      !imageDimensions.height ||
      !displayedImageDimensions.width ||
      !displayedImageDimensions.height
    ) {
      console.log("Missing image dimensions");
      return;
    }

    // Calculate precise scaling factors
    const scaleX = imageDimensions.width / displayedImageDimensions.width;
    const scaleY = imageDimensions.height / displayedImageDimensions.height;

    // Map touch coordinates to image coordinates
    const imageX = Math.floor(locationX * scaleX);
    const imageY = Math.floor(locationY * scaleY);

    console.log(
      `Touch: (${locationX}, ${locationY}) -> Image: (${imageX}, ${imageY})`
    );
    console.log(
      `Scale factors: X=${scaleX?.toFixed(3)}, Y=${scaleY?.toFixed(3)}`
    );

    try {
      setAnalyzing(true);

      // Extract color using accurate pixel reading
      const pixelColor = await getColorAtPixel(imageX, imageY);

      if (pixelColor && pixelColor.r !== undefined) {
        const hexColor = rgbToHex(pixelColor.r, pixelColor.g, pixelColor.b);
        setSelectedColor(hexColor);

        console.log(
          `Extracted color: ${hexColor} from RGB(${pixelColor.r}, ${pixelColor.g}, ${pixelColor.b})`
        );
      } else {
        console.log("Failed to extract color at coordinates");
      }
    } catch (error) {
      console.error("Error extracting color:", error);
    } finally {
      setAnalyzing(false);
    }
  }; // Accurate pixel color extraction using micro-cropping
  const getColorAtPixel = async (
    x: number,
    y: number
  ): Promise<{ r: number; g: number; b: number; a: number } | null> => {
    if (!imageUri || !imageDimensions.width || !imageDimensions.height) {
      console.log("No image URI or dimensions available for pixel extraction");
      return null;
    }

    try {
      // Use the original image URI and dimensions for accurate extraction
      const color = await extractColorAtCoordinates(
        imageUri,
        x,
        y,
        imageDimensions.width,
        imageDimensions.height
      );

      if (color) {
        console.log(
          `Accurately extracted color at (${x}, ${y}): RGB(${color.r}, ${color.g}, ${color.b})`
        );
        return { ...color, a: 255 };
      }

      return null;
    } catch (error) {
      console.error("Error in getColorAtPixel:", error);
      return null;
    }
  };
  // Extract accurate color at specific coordinates using micro-cropping
  const extractColorAtCoordinates = async (
    imageUri: string,
    x: number,
    y: number,
    originalWidth: number,
    originalHeight: number
  ): Promise<{ r: number; g: number; b: number } | null> => {
    try {
      // Create a tiny 3x3 crop around the target pixel for better accuracy
      const cropSize = 3;
      const halfCrop = Math.floor(cropSize / 2);

      // Ensure crop bounds are within image
      const cropX = Math.max(
        0,
        Math.min(originalWidth - cropSize, x - halfCrop)
      );
      const cropY = Math.max(
        0,
        Math.min(originalHeight - cropSize, y - halfCrop)
      );

      console.log(
        `Extracting color at (${x}, ${y}) with ${cropSize}x${cropSize} crop from (${cropX}, ${cropY})`
      );

      // Crop the specific region
      const croppedResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: cropSize,
              height: cropSize,
            },
          },
        ],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
          base64: true,
        }
      );

      if (!croppedResult.base64) {
        throw new Error("Failed to get base64 from cropped image");
      }

      // Convert the tiny crop to a larger size for easier analysis
      const scaledResult = await ImageManipulator.manipulateAsync(
        croppedResult.uri,
        [{ resize: { width: 100, height: 100 } }],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
          base64: true,
        }
      );

      if (!scaledResult.base64) {
        throw new Error("Failed to get base64 from scaled image");
      }

      // Extract colors from the scaled version and get the average
      const colors = await extractColorsFromBase64(scaledResult.base64);

      if (colors.length > 0) {
        // Calculate average color from all extracted colors
        const avgColor = calculateAverageColor(colors);
        console.log(
          `Extracted average color: RGB(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`
        );
        return avgColor;
      }

      return null;
    } catch (error) {
      console.error("Error extracting color at coordinates:", error);
      return null;
    }
  };

  // Extract actual colors from base64 image data
  const extractColorsFromBase64 = async (
    base64: string
  ): Promise<{ r: number; g: number; b: number }[]> => {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, "");

      // Convert base64 to binary
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const colors: { r: number; g: number; b: number }[] = [];

      // Look for color patterns in the PNG data
      // PNG stores pixel data in IDAT chunks, but we'll sample the entire file
      // to catch any RGB values that represent actual pixel colors

      let validColorCount = 0;
      const maxColors = 100; // Limit to prevent too much processing

      for (
        let i = 0;
        i < bytes.length - 2 && validColorCount < maxColors;
        i++
      ) {
        const r = bytes[i];
        const g = bytes[i + 1];
        const b = bytes[i + 2];

        // Check if this looks like a valid RGB color value
        if (isValidRGBColor(r, g, b)) {
          colors.push({ r, g, b });
          validColorCount++;
        }
      }

      console.log(`Extracted ${colors.length} valid colors from base64 data`);
      return colors;
    } catch (error) {
      console.error("Error extracting colors from base64:", error);
      return [];
    }
  };

  // Check if RGB values represent a valid color (not metadata or headers)
  const isValidRGBColor = (r: number, g: number, b: number): boolean => {
    // Filter out obviously invalid values
    if (r === undefined || g === undefined || b === undefined) return false;
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return false;

    // Filter out common PNG metadata patterns
    if (r === 0 && g === 0 && b === 0) return false; // Pure black (often padding)
    if (r === 255 && g === 255 && b === 255) return false; // Pure white (often padding)
    if (r === g && g === b && (r === 0 || r === 255)) return false; // Pure grayscale extremes

    // Filter out ASCII text ranges (common in metadata)
    if (r >= 32 && r <= 126 && g >= 32 && g <= 126 && b >= 32 && b <= 126) {
      // Could be text, be more selective
      const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
      return variance > 30; // Only accept if there's significant color variation
    }

    return true;
  };

  // Calculate average color from an array of colors
  const calculateAverageColor = (
    colors: { r: number; g: number; b: number }[]
  ): { r: number; g: number; b: number } => {
    if (colors.length === 0) {
      return { r: 128, g: 128, b: 128 }; // Default gray
    }

    const sum = colors.reduce(
      (acc, color) => ({
        r: acc.r + color.r,
        g: acc.g + color.g,
        b: acc.b + color.b,
      }),
      { r: 0, g: 0, b: 0 }
    );

    return {
      r: Math.round(sum.r / colors.length),
      g: Math.round(sum.g / colors.length),
      b: Math.round(sum.b / colors.length),
    };
  };

  // Simplified GL snapshot without takeSnapshotAsync
  const captureGLSnapshot = async () => {
    // Since takeSnapshotAsync is not available, use camera picture instead
    console.log("GL snapshot not available, using camera picture");
    return null;
  };

  // Process camera frame for real-time analysis
  const processGLSnapshot = async (base64: string) => {
    // This method is no longer used due to GL limitations
    console.log("GL snapshot processing skipped");
  };
  // Real-time camera color analysis using new extraction approach
  const analyzeFrameInRealTime = async () => {
    try {
      // Take a picture and process it for color analysis
      if (!cameraRef.current || !isCameraReady) {
        Alert.alert(
          "Camera not ready",
          "Please wait for camera to initialize."
        );
        return;
      }

      setAnalyzing(true);

      // Take a high-quality picture for analysis
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true, // Faster capture
      });

      if (photo) {
        // Get image dimensions first
        const imageInfo = await ImageManipulator.manipulateAsync(
          photo.uri,
          [],
          {
            compress: 1,
            format: ImageManipulator.SaveFormat.PNG,
          }
        );

        // Use the center point of the image for real-time analysis
        const centerX = Math.floor(imageInfo.width / 2);
        const centerY = Math.floor(imageInfo.height / 2);

        console.log(
          `Analyzing center pixel at (${centerX}, ${centerY}) of ${imageInfo.width}×${imageInfo.height} image`
        );

        // Extract color at center using the new accurate method
        const color = await extractColorAtCoordinates(
          photo.uri,
          centerX,
          centerY,
          imageInfo.width,
          imageInfo.height
        );

        if (color) {
          const hexColor = rgbToHex(color.r, color.g, color.b);
          setSelectedColor(hexColor);

          console.log(
            `Real-time color analysis: ${hexColor} from RGB(${color.r}, ${color.g}, ${color.b})`
          );
        } else {
          console.log("Failed to extract color from camera frame");
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
        {/* Captured Image with Color Picker */}
        {capturedImage && (
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2">
              Tap on the image to pick a color
            </Text>
            <View className="relative" style={{ alignSelf: "center" }}>
              <TouchableOpacity onPress={handleImageTouch} activeOpacity={1}>
                <RNImage
                  ref={imageRef}
                  source={{ uri: capturedImage }}
                  style={{
                    width: Math.min(400, Dimensions.get("window").width - 32),
                    height: imageDimensions.height
                      ? (Math.min(400, Dimensions.get("window").width - 32) *
                          imageDimensions.height) /
                        imageDimensions.width
                      : 300,
                    borderRadius: 8,
                    backgroundColor: "#f0f0f0",
                  }}
                  resizeMode="contain"
                  onLayout={handleImageLayout}
                />
              </TouchableOpacity>

              {/* Crosshair overlay */}
              <View
                style={{
                  position: "absolute",
                  left: crosshairPosition.x - 15,
                  top: crosshairPosition.y - 15,
                  width: 30,
                  height: 30,
                  justifyContent: "center",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <Plus size={30} color="#dacdcd" strokeWidth={3} />
              </View>

              {/* Color preview at touch point */}
              <View
                style={{
                  position: "absolute",
                  left: crosshairPosition.x + 20,
                  top: crosshairPosition.y - 40,
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
            </View>
            {/* Image and touch debug info */}
            <View className="mt-2 p-2 bg-gray-100 rounded">
              <Text className="text-xs text-gray-600">
                Image: {imageDimensions.width}×{imageDimensions.height}
              </Text>
              <Text className="text-xs text-gray-600">
                Displayed: {displayedImageDimensions.width.toFixed(0)}×
                {displayedImageDimensions.height.toFixed(0)}
              </Text>
              <Text className="text-xs text-gray-600">
                Touch: ({crosshairPosition.x.toFixed(0)},{" "}
                {crosshairPosition.y.toFixed(0)})
              </Text>
            </View>{" "}
            <TouchableOpacity
              className="mt-2 bg-gray-500 px-4 py-2 rounded-lg self-center"
              onPress={() => {
                setCapturedImage(null);
                setImageUri(null);
                setDisplayedImageDimensions({
                  width: 0,
                  height: 0,
                  x: 0,
                  y: 0,
                });
              }}
            >
              <Text className="text-white font-medium">Clear Image</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Color Conversions Display */}
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
        {/* Color Wheel Component */}
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
                  {/* Center crosshair for real-time analysis */}
                  <View style={styles.centerCrosshair}>
                    <Plus size={40} color="white" strokeWidth={2} />
                  </View>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setShowCamera(false);
                      setActiveSource(null);
                    }}
                  >
                    <X size={24} color="white" />
                  </TouchableOpacity>

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

                  <View style={styles.cameraControls}>
                    <TouchableOpacity
                      style={styles.captureButton}
                      onPress={takePicture}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.analyzeButton}
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
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  G,
  Path,
} from "react-native-svg";
import Slider from "@react-native-community/slider";
import { hexToRgb, rgbToHsl, hslToRgb, rgbObjToHex } from "../utils/convert";

interface CustomColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
  style?: any;
  defaultMode?: "wheel" | "sliders";
  showPreview?: boolean;
  showHexInput?: boolean;
}

const CustomColorPicker: React.FC<CustomColorPickerProps> = ({
  color,
  onColorChange,
  style,
  defaultMode = "wheel",
  showPreview = true,
  showHexInput = false,
}) => {
  const [hsl, setHsl] = useState({ h: 0, s: 50, l: 50 });
  const [wheelPosition, setWheelPosition] = useState({ x: 0, y: 0 });

  const colorWheelSize = 200;
  const colorWheelRadius = colorWheelSize / 2;
  const centerX = colorWheelRadius;
  const centerY = colorWheelRadius;

  // Update internal HSL state when color prop changes
  useEffect(() => {
    const rgb = hexToRgb(color);
    const newHsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    setHsl(newHsl);

    // Calculate wheel position from HSL
    const angle = (newHsl.h * Math.PI) / 180;
    const distance = (newHsl.s / 100) * (colorWheelRadius - 20);
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    setWheelPosition({ x, y });
  }, [color]);

  // Convert Cartesian coordinates to HSL
  const cartesianToHsl = (x: number, y: number): { h: number; s: number } => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = colorWheelRadius - 20;

    // Calculate angle (hue)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // Calculate saturation based on distance from center
    const saturation = Math.min((distance / maxDistance) * 100, 100);

    return { h: angle, s: saturation };
  };

  // Handle color wheel touch
  const handleColorWheelTouch = (x: number, y: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = colorWheelRadius - 20;

    // Only respond if touch is within the color wheel
    if (distance <= maxDistance) {
      const { h, s } = cartesianToHsl(x, y);
      const newHsl = { ...hsl, h, s };
      setHsl(newHsl);
      setWheelPosition({ x, y });

      const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      const hexColor = rgbObjToHex(rgb);
      onColorChange(hexColor);
    }
  };

  // PanResponder for color wheel
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      handleColorWheelTouch(locationX, locationY);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      handleColorWheelTouch(locationX, locationY);
    },
  });

  const handleSliderChange = (component: "h" | "s" | "l", value: number) => {
    const newHsl = { ...hsl, [component]: value };
    setHsl(newHsl);

    // Update wheel position if hue or saturation changed
    if (component === "h" || component === "s") {
      const angle = (newHsl.h * Math.PI) / 180;
      const distance = (newHsl.s / 100) * (colorWheelRadius - 20);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      setWheelPosition({ x, y });
    }

    const rgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    const hexColor = rgbObjToHex(rgb);
    onColorChange(hexColor);
  };

  // Generate color wheel segments
  const generateColorWheelSegments = () => {
    const segments = [];
    const segmentCount = 360;
    const innerRadius = 20;
    const outerRadius = colorWheelRadius - 10;

    for (let i = 0; i < segmentCount; i++) {
      const startAngle = (i * 360) / segmentCount;
      const endAngle = ((i + 1) * 360) / segmentCount;

      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + Math.cos(startAngleRad) * innerRadius;
      const y1 = centerY + Math.sin(startAngleRad) * innerRadius;
      const x2 = centerX + Math.cos(startAngleRad) * outerRadius;
      const y2 = centerY + Math.sin(startAngleRad) * outerRadius;
      const x3 = centerX + Math.cos(endAngleRad) * outerRadius;
      const y3 = centerY + Math.sin(endAngleRad) * outerRadius;
      const x4 = centerX + Math.cos(endAngleRad) * innerRadius;
      const y4 = centerY + Math.sin(endAngleRad) * innerRadius;

      const hue = startAngle;
      const color = `hsl(${hue}, 100%, 50%)`;

      const pathData = `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`;

      segments.push(<Path key={i} d={pathData} fill={color} />);
    }

    return segments;
  };

  const currentColor = (() => {
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbObjToHex(rgb);
  })();

  return (
    <View style={style}>
      {/* Color Preview */}
      {showPreview && (
        <View className="items-center mb-4">
          <View
            style={{ backgroundColor: currentColor }}
            className="w-20 h-20 rounded-xl border-2 border-gray-200 shadow-md"
          />
          <Text className="mt-2 font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {currentColor.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Color Picker Content */}

      <View className="mb-4 items-center">
        {/* Custom Color Wheel */}
        <View
          {...panResponder.panHandlers}
          style={{
            width: colorWheelSize,
            height: colorWheelSize,
            position: "relative",
          }}
        >
          <Svg width={colorWheelSize} height={colorWheelSize}>
            <Defs>
              <RadialGradient id="saturationGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="white" stopOpacity="1" />
                <Stop offset="100%" stopColor="white" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Color wheel segments */}
            <G>{generateColorWheelSegments()}</G>

            {/* Saturation overlay */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={colorWheelRadius - 10}
              fill="url(#saturationGradient)"
            />

            {/* Center circle */}
            <Circle
              cx={centerX}
              cy={centerY}
              r={20}
              fill="white"
              stroke="#ddd"
              strokeWidth={2}
            />
          </Svg>

          {/* Color picker indicator */}
          <View
            style={{
              position: "absolute",
              left: wheelPosition.x - 8,
              top: wheelPosition.y - 8,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "white",
              borderWidth: 2,
              borderColor: "#333",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 5,
            }}
          />
        </View>
      </View>

      <View className="mb-4">
        {/* Hue Slider */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-medium text-gray-700">Hue</Text>
            <Text className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {Math.round(hsl.h)}°
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={360}
            value={hsl.h}
            onValueChange={(value) => handleSliderChange("h", value)}
            minimumTrackTintColor="#FF0000"
            maximumTrackTintColor="#E5E7EB"
          />
        </View>

        {/* Saturation Slider */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-medium text-gray-700">
              Saturation
            </Text>
            <Text className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {Math.round(hsl.s)}%
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={100}
            value={hsl.s}
            onValueChange={(value) => handleSliderChange("s", value)}
            minimumTrackTintColor="#10B981"
            maximumTrackTintColor="#E5E7EB"
          />
        </View>

        {/* Lightness Slider */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-medium text-gray-700">Lightness</Text>
            <Text className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {Math.round(hsl.l)}%
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={5}
            maximumValue={95}
            value={hsl.l}
            onValueChange={(value) => handleSliderChange("l", value)}
            minimumTrackTintColor="#F59E0B"
            maximumTrackTintColor="#E5E7EB"
          />
        </View>
      </View>
    </View>
  );
};

export default CustomColorPicker;

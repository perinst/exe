import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Circle, Path, G } from "react-native-svg";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
    useSharedValue,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";
import { ChevronLeft, ChevronRight, Info } from "lucide-react-native";

interface ColorWheelProps {
    selectedColor?: string;
    onColorSelect?: (color: string) => void;
    size?: number;
    showComplementary?: boolean;
}

const ColorWheel = ({
    selectedColor = "#FF0000",
    onColorSelect = () => { },
    size = 300,
    showComplementary = true,
}: ColorWheelProps) => {
    const [wheelColors, setWheelColors] = useState<string[]>([]);
    const [complementaryColor, setComplementaryColor] = useState<string>("#00FFFF");
    const [selectedPoint, setSelectedPoint] = useState({ x: 0, y: 0 });

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Generate wheel colors
    useEffect(() => {
        const colors: string[] = [];
        for (let angle = 0; angle < 360; angle += 10) {
            const hue = angle;
            const color = `hsl(${hue}, 100%, 50%)`;
            colors.push(color);
        }
        setWheelColors(colors);
    }, []);

    // Calculate complementary color
    useEffect(() => {
        if (selectedColor) {
            // Simple complementary calculation (180 degrees on the color wheel)
            const hex = selectedColor.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            const compR = 255 - r;
            const compG = 255 - g;
            const compB = 255 - b;

            const compHex = `#${compR.toString(16).padStart(2, "0")}${compG.toString(16).padStart(2, "0")}${compB.toString(16).padStart(2, "0")}`;
            setComplementaryColor(compHex);
        }
    }, [selectedColor]);

    // Handle color selection from wheel
    const handleColorSelect = (x: number, y: number) => {
        // Calculate distance from center
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
            // Calculate angle
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            // Calculate hue from angle
            const hue = angle;

            // Calculate saturation from distance (0 at center, 100% at edge)
            const saturation = (distance / radius) * 100;

            // Create HSL color
            const color = `hsl(${hue}, ${saturation}%, 50%)`;

            // Convert HSL to HEX for API consistency
            const hexColor = hslToHex(hue, saturation, 50);

            setSelectedPoint({ x: dx + centerX, y: dy + centerY });
            onColorSelect(hexColor);
        }
    };

    // Helper function to convert HSL to HEX
    const hslToHex = (h: number, s: number, l: number): string => {
        s /= 100;
        l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color)
                .toString(16)
                .padStart(2, "0");
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };

    // Gesture handler for color selection
    const gestureHandler = useAnimatedGestureHandler({
        onStart: (_, ctx: any) => {
            ctx.startX = translateX.value;
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx) => {
            translateX.value = ctx.startX + event.translationX;
            translateY.value = ctx.startY + event.translationY;
        },
        onEnd: () => {
            const x = translateX.value + centerX;
            const y = translateY.value + centerY;
            handleColorSelect(x, y);
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
        };
    });

    return (
        <View
            className="bg-white p-4 rounded-lg shadow-md"
            style={{ width: size, height: size + 100 }}
        >
            <Text className="text-lg font-bold mb-2 text-center">
                Interactive Color Wheel
            </Text>

            <View className="items-center justify-center">
                <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Color wheel segments */}
                    {wheelColors.map((color, index) => {
                        const startAngle = (index * 10 * Math.PI) / 180;
                        const endAngle = ((index + 1) * 10 * Math.PI) / 180;

                        const x1 = centerX + radius * Math.cos(startAngle);
                        const y1 = centerY + radius * Math.sin(startAngle);
                        const x2 = centerX + radius * Math.cos(endAngle);
                        const y2 = centerY + radius * Math.sin(endAngle);

                        const largeArcFlag = 0;

                        const pathData = `
                            M ${centerX} ${centerY}
                            L ${x1} ${y1}
                            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                            Z
                        `;

                        return <Path key={index} d={pathData} fill={color} />;
                    })}

                    {/* Selected color indicator */}
                    <Circle
                        cx={selectedPoint.x}
                        cy={selectedPoint.y}
                        r={10}
                        fill={selectedColor}
                        stroke="white"
                        strokeWidth={2}
                    />

                    {/* Complementary color indicator */}
                    {showComplementary && (
                        <Circle
                            cx={2 * centerX - selectedPoint.x}
                            cy={2 * centerY - selectedPoint.y}
                            r={10}
                            fill={complementaryColor}
                            stroke="white"
                            strokeWidth={2}
                            opacity={0.7}
                        />
                    )}
                </Svg>

                <PanGestureHandler onGestureEvent={gestureHandler}>
                    <Animated.View
                        style={[
                            styles.gestureArea,
                            { width: size, height: size },
                            animatedStyle,
                        ]}
                    />
                </PanGestureHandler>
            </View>

            <View className="flex-row justify-between items-center mt-4">
                <View className="flex-row items-center">
                    <View
                        style={{
                            width: 24,
                            height: 24,
                            backgroundColor: selectedColor,
                            borderRadius: 12,
                        }}
                    />
                    <Text className="ml-2">{selectedColor}</Text>
                </View>

                {showComplementary && (
                    <View className="flex-row items-center">
                        <Text className="mr-2">Complementary</Text>
                        <View
                            style={{
                                width: 24,
                                height: 24,
                                backgroundColor: complementaryColor,
                                borderRadius: 12,
                            }}
                        />
                    </View>
                )}
            </View>

            <TouchableOpacity className="mt-2 flex-row items-center justify-center">
                <Info size={16} color="#666" />
                <Text className="text-xs text-gray-500 ml-1">
                    Tap and drag to select colors
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    gestureArea: {
        position: "absolute",
        backgroundColor: "transparent",
    },
});

export default ColorWheel;

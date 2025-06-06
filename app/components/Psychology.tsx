import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { Search, X, Eye, Palette, Heart, Brain } from "lucide-react-native";

interface ColorInfo {
  name: string;
  hex: string;
  category: "warm" | "cool" | "neutral";
  effects: string[];
  psychological: string;
  realWorldExamples: string[];
  shades: { name: string; hex: string; meaning: string }[];
}

const Psychology = () => {
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);
  const [showColorModal, setShowColorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "warm" | "cool" | "neutral"
  >("all");

  const colorData: ColorInfo[] = [
    // Warm Colors
    {
      name: "Red",
      hex: "#FF0000",
      category: "warm",
      effects: [
        "Energy",
        "Passion",
        "Love",
        "Excitement",
        "Urgency",
        "Danger",
        "Anger",
      ],
      psychological:
        "Can increase heart rate, blood pressure and metabolism. Attracts intense attention and stimulates action.",
      realWorldExamples: [
        "Stop signs and emergency signals",
        "Restaurant logos to stimulate appetite",
        "Sale tags to create urgency",
        "Sports team colors for energy",
      ],
      shades: [
        {
          name: "Crimson",
          hex: "#DC143C",
          meaning: "Deep passion and intensity",
        },
        { name: "Coral", hex: "#FF7F50", meaning: "Warmth and friendliness" },
        { name: "Pink", hex: "#FFC0CB", meaning: "Romance and tenderness" },
      ],
    },
    {
      name: "Orange",
      hex: "#FFA500",
      category: "warm",
      effects: [
        "Enthusiasm",
        "Creativity",
        "Adventure",
        "Warmth",
        "Fun",
        "Optimism",
      ],
      psychological:
        "Stimulates creativity and appetite. Creates a friendly and inviting feeling while encouraging social interaction.",
      realWorldExamples: [
        "Food brands and restaurants",
        "Creative agencies and art supplies",
        "Children's toys and playgrounds",
        "Autumn decorations",
      ],
      shades: [
        { name: "Tangerine", hex: "#FF8C00", meaning: "Energy and vitality" },
        { name: "Peach", hex: "#FFCBA4", meaning: "Gentle warmth and comfort" },
        { name: "Amber", hex: "#FFBF00", meaning: "Luxury and sophistication" },
      ],
    },
    {
      name: "Yellow",
      hex: "#FFFF00",
      category: "warm",
      effects: [
        "Optimism",
        "Happiness",
        "Hope",
        "Intelligence",
        "Playfulness",
        "Attention",
        "Anxiety (when too bright)",
      ],
      psychological:
        "Stimulates mental activity and concentration. Can cause eye strain if used too much. Associated with clarity and enlightenment.",
      realWorldExamples: [
        "Caution signs and school buses",
        "Highlighters and sticky notes",
        "Fast food chains",
        "Children's educational materials",
      ],
      shades: [
        {
          name: "Golden Yellow",
          hex: "#FFD700",
          meaning: "Wealth and prosperity",
        },
        { name: "Lemon", hex: "#FFFACD", meaning: "Freshness and clarity" },
        {
          name: "Mustard",
          hex: "#FFDB58",
          meaning: "Earthiness and stability",
        },
      ],
    },
    {
      name: "Pink",
      hex: "#FFC0CB",
      category: "warm",
      effects: [
        "Romance",
        "Love",
        "Tenderness",
        "Femininity",
        "Innocence",
        "Calmness (light pink)",
      ],
      psychological:
        "Has a calming effect, reduces stress and aggression. Often associated with sweetness, care, and nurturing.",
      realWorldExamples: [
        "Beauty and cosmetics brands",
        "Baby products",
        "Breast cancer awareness",
        "Valentine's Day decorations",
      ],
      shades: [
        {
          name: "Hot Pink",
          hex: "#FF69B4",
          meaning: "Bold confidence and energy",
        },
        { name: "Rose", hex: "#FF007F", meaning: "Romance and passion" },
        { name: "Blush", hex: "#DE5D83", meaning: "Gentle femininity" },
      ],
    },

    // Cool Colors
    {
      name: "Blue",
      hex: "#0000FF",
      category: "cool",
      effects: [
        "Peace",
        "Trust",
        "Stability",
        "Responsibility",
        "Serenity",
        "Coldness",
        "Sadness (dark tones)",
      ],
      psychological:
        "Slows heart rate and respiration, creates a feeling of relaxation. Often associated with professionalism and trustworthiness.",
      realWorldExamples: [
        "Corporate logos and banking",
        "Healthcare and medical facilities",
        "Social media platforms",
        "Ocean and sky imagery",
      ],
      shades: [
        {
          name: "Navy Blue",
          hex: "#000080",
          meaning: "Authority and professionalism",
        },
        {
          name: "Sky Blue",
          hex: "#87CEEB",
          meaning: "Freedom and tranquility",
        },
        {
          name: "Royal Blue",
          hex: "#4169E1",
          meaning: "Elegance and sophistication",
        },
      ],
    },
    {
      name: "Green",
      hex: "#00FF00",
      category: "cool",
      effects: [
        "Nature",
        "Health",
        "Growth",
        "Balance",
        "Freshness",
        "Jealousy",
      ],
      psychological:
        "Creates a feeling of relaxation, reduces stress. Associated with healing, hope, and environmental consciousness.",
      realWorldExamples: [
        "Environmental organizations",
        "Health and wellness brands",
        "Financial growth indicators",
        "Natural and organic products",
      ],
      shades: [
        {
          name: "Forest Green",
          hex: "#228B22",
          meaning: "Stability and growth",
        },
        {
          name: "Mint Green",
          hex: "#98FB98",
          meaning: "Freshness and renewal",
        },
        { name: "Emerald", hex: "#50C878", meaning: "Luxury and prosperity" },
      ],
    },
    {
      name: "Purple",
      hex: "#800080",
      category: "cool",
      effects: [
        "Luxury",
        "Mystery",
        "Creativity",
        "Spirituality",
        "Wealth",
        "Sadness (dark tones)",
      ],
      psychological:
        "Stimulates imagination and creativity. Can create a feeling of luxury or depth. Associated with wisdom and magic.",
      realWorldExamples: [
        "Luxury brands and cosmetics",
        "Creative and artistic ventures",
        "Spiritual and mystical themes",
        "Royal and noble imagery",
      ],
      shades: [
        { name: "Lavender", hex: "#E6E6FA", meaning: "Calm and serenity" },
        {
          name: "Violet",
          hex: "#8A2BE2",
          meaning: "Creativity and inspiration",
        },
        { name: "Plum", hex: "#8E4585", meaning: "Sophistication and depth" },
      ],
    },

    // Neutral Colors
    {
      name: "Black",
      hex: "#000000",
      category: "neutral",
      effects: [
        "Power",
        "Luxury",
        "Mystery",
        "Solemnity",
        "Emptiness",
        "Mourning",
      ],
      psychological:
        "Can create a strong, sophisticated feeling but can also cause a heavy feeling if overused. Associated with authority and elegance.",
      realWorldExamples: [
        "Luxury fashion and accessories",
        "High-end technology products",
        "Formal events and ceremonies",
        "Professional business attire",
      ],
      shades: [
        {
          name: "Charcoal",
          hex: "#36454F",
          meaning: "Professional sophistication",
        },
        { name: "Jet Black", hex: "#0A0A0A", meaning: "Ultimate elegance" },
        { name: "Graphite", hex: "#383838", meaning: "Modern minimalism" },
      ],
    },
    {
      name: "White",
      hex: "#FFFFFF",
      category: "neutral",
      effects: [
        "Purity",
        "Clarity",
        "Simplicity",
        "Cleanliness",
        "New Beginnings",
        "Emptiness",
      ],
      psychological:
        "Creates a feeling of spaciousness and airiness. Represents simplicity, clarity, and fresh starts.",
      realWorldExamples: [
        "Medical and healthcare facilities",
        "Minimalist design and architecture",
        "Wedding dresses and ceremonies",
        "Apple and tech products",
      ],
      shades: [
        { name: "Ivory", hex: "#FFFFF0", meaning: "Soft elegance" },
        { name: "Pearl", hex: "#F8F6F0", meaning: "Subtle sophistication" },
        { name: "Snow White", hex: "#FFFAFA", meaning: "Pure freshness" },
      ],
    },
    {
      name: "Gray",
      hex: "#808080",
      category: "neutral",
      effects: [
        "Neutrality",
        "Balance",
        "Practicality",
        "Maturity",
        "Dullness",
        "Indecision",
      ],
      psychological:
        "Can create a sense of stability and professionalism but can also create a sense of boredom or depression if overused.",
      realWorldExamples: [
        "Corporate offices and business",
        "Industrial and technical products",
        "Modern architecture",
        "Professional photography backgrounds",
      ],
      shades: [
        { name: "Silver", hex: "#C0C0C0", meaning: "Modern and sleek" },
        {
          name: "Slate Gray",
          hex: "#708090",
          meaning: "Sophisticated neutrality",
        },
        {
          name: "Charcoal Gray",
          hex: "#36454F",
          meaning: "Professional depth",
        },
      ],
    },
    {
      name: "Brown",
      hex: "#8B4513",
      category: "neutral",
      effects: [
        "Earth",
        "Stability",
        "Reliability",
        "Warmth",
        "Rusticity",
        "Boredom",
      ],
      psychological:
        "Creates a sense of security and closeness to nature. Associated with dependability, comfort, and earthiness.",
      realWorldExamples: [
        "Coffee and chocolate brands",
        "Outdoor and adventure gear",
        "Rustic and natural decor",
        "Leather goods and furniture",
      ],
      shades: [
        {
          name: "Chocolate",
          hex: "#7B3F00",
          meaning: "Rich comfort and luxury",
        },
        { name: "Tan", hex: "#D2B48C", meaning: "Natural warmth" },
        {
          name: "Mahogany",
          hex: "#C04000",
          meaning: "Sophisticated earthiness",
        },
      ],
    },
  ];

  const filteredColors = colorData.filter((color) => {
    const matchesSearch =
      color.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      color.effects.some((effect) =>
        effect.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "all" || color.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openColorModal = (color: ColorInfo) => {
    setSelectedColor(color);
    setShowColorModal(true);
  };

  const CategoryButton = ({
    category,
    label,
  }: {
    category: "all" | "warm" | "cool" | "neutral";
    label: string;
  }) => (
    <TouchableOpacity
      className={`px-4 py-2 rounded-full mr-2 ${
        selectedCategory === category ? "bg-blue-500" : "bg-gray-200"
      }`}
      onPress={() => setSelectedCategory(category)}
    >
      <Text
        className={`${
          selectedCategory === category ? "text-white" : "text-gray-700"
        } font-medium`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-2 text-center">
          Color Psychology
        </Text>
        <Text className="text-base text-center mb-6 text-gray-600">
          Discover the emotional and psychological effects of different colors
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg p-3 mb-4">
          <Search size={20} color="#666" />
          <TextInput
            className="flex-1 ml-2"
            placeholder="Search colors or effects..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6"
        >
          <View className="flex-row">
            <CategoryButton category="all" label="All Colors" />
            <CategoryButton category="warm" label="Warm Colors" />
            <CategoryButton category="cool" label="Cool Colors" />
            <CategoryButton category="neutral" label="Neutral Colors" />
          </View>
        </ScrollView>

        {/* Color Cards */}
        <View className="space-y-4">
          {filteredColors.map((color, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              onPress={() => openColorModal(color)}
            >
              <View className="flex-row">
                <View
                  className="w-20 h-20"
                  style={{ backgroundColor: color.hex }}
                />
                <View className="flex-1 p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-lg font-bold">{color.name}</Text>
                    <View
                      className={`px-2 py-1 rounded-full ${
                        color.category === "warm"
                          ? "bg-red-100"
                          : color.category === "cool"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          color.category === "warm"
                            ? "text-red-700"
                            : color.category === "cool"
                            ? "text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {color.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-gray-600 text-sm mb-2"
                    numberOfLines={2}
                  >
                    {color.psychological}
                  </Text>
                  <View className="flex-row flex-wrap">
                    {color.effects.slice(0, 3).map((effect, idx) => (
                      <View
                        key={idx}
                        className="bg-gray-100 px-2 py-1 rounded mr-1 mb-1"
                      >
                        <Text className="text-xs text-gray-700">{effect}</Text>
                      </View>
                    ))}
                    {color.effects.length > 3 && (
                      <View className="bg-gray-100 px-2 py-1 rounded">
                        <Text className="text-xs text-gray-700">
                          +{color.effects.length - 3} more
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filteredColors.length === 0 && (
          <View className="items-center justify-center py-12">
            <Palette size={48} color="#d1d5db" />
            <Text className="text-gray-500 mt-4">No colors found</Text>
            <Text className="text-gray-400 text-sm">
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Color Detail Modal */}
      <Modal
        visible={showColorModal}
        animationType="slide"
        onRequestClose={() => setShowColorModal(false)}
      >
        <View className="flex-1 bg-white">
          <ScrollView className="flex-1">
            {selectedColor && (
              <>
                {/* Header */}
                <View className="bg-gray-50 p-4 border-b border-gray-200">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-lg mr-3"
                        style={{ backgroundColor: selectedColor.hex }}
                      />
                      <View>
                        <Text className="text-xl font-bold">
                          {selectedColor.name}
                        </Text>
                        <Text className="text-gray-600">
                          {selectedColor.hex}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowColorModal(false)}
                      className="p-2"
                    >
                      <X size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="p-4">
                  {/* Psychological Effects */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <Brain size={20} color="#3b82f6" />
                      <Text className="text-lg font-bold ml-2">
                        Psychological Impact
                      </Text>
                    </View>
                    <Text className="text-gray-700 leading-relaxed">
                      {selectedColor.psychological}
                    </Text>
                  </View>

                  {/* Emotional Effects */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <Heart size={20} color="#ef4444" />
                      <Text className="text-lg font-bold ml-2">
                        Emotional Effects
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap">
                      {selectedColor.effects.map((effect, idx) => (
                        <View
                          key={idx}
                          className="bg-blue-100 px-3 py-2 rounded-lg mr-2 mb-2"
                        >
                          <Text className="text-blue-800 font-medium">
                            {effect}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Real World Examples */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <Eye size={20} color="#10b981" />
                      <Text className="text-lg font-bold ml-2">
                        Real World Usage
                      </Text>
                    </View>
                    {selectedColor.realWorldExamples.map((example, idx) => (
                      <View key={idx} className="flex-row items-start mb-2">
                        <Text className="text-green-600 mr-2">•</Text>
                        <Text className="text-gray-700 flex-1">{example}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Color Variations */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <Palette size={20} color="#8b5cf6" />
                      <Text className="text-lg font-bold ml-2">
                        Variations & Meanings
                      </Text>
                    </View>
                    {selectedColor.shades.map((shade, idx) => (
                      <View
                        key={idx}
                        className="flex-row items-center mb-8 p-3 bg-gray-50 rounded-lg"
                      >
                        <View
                          className="w-10 h-10 rounded-[20px] mr-3"
                          style={{ backgroundColor: shade.hex }}
                        />
                        <View className="flex-1">
                          <Text className="font-medium">{shade.name}</Text>
                          <Text className="text-gray-600 text-sm">
                            {shade.meaning}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Note */}
                  <View className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <Text className="text-yellow-800 font-medium mb-2">
                      Cultural Note
                    </Text>
                    <Text className="text-yellow-700 text-sm">
                      The impact of color can vary depending on culture,
                      personal experience, and the specific shade of the color.
                      These effects represent general psychological responses
                      observed in Western cultures.
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default Psychology;

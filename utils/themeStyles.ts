
// A palette of Vintage-inspired Morandi/Triadic colors
// Designed to be "Tone on Tone" with the Mint/Teal brand, but distinct enough for users.

export const USER_THEME_PALETTE = [
    // 1. Antique Rose (The Warm Contrast) - 取代正紅，更像陶土/乾燥玫瑰
    { 
        id: 0, 
        bg: 'bg-[#D66F65]/10 dark:bg-[#D66F65]/20', 
        border: 'border-[#D66F65]/60', 
        text: 'text-[#8A3F30] dark:text-[#FFD1CC]',
        badge: 'bg-[#D66F65] text-white',
        ring: 'ring-[#D66F65]'
    },
    // 2. Harvest Gold (The Bright Accent) - 取代正黃，更像麥穗/芥末黃
    { 
        id: 1, 
        bg: 'bg-[#D4A373]/15 dark:bg-[#D4A373]/20', 
        border: 'border-[#D4A373]/70', 
        text: 'text-[#8F6424] dark:text-[#FFE8CC]',
        badge: 'bg-[#D4A373] text-white',
        ring: 'ring-[#D4A373]'
    },
    // 3. Slate Indigo (The Cool Harmony) - 取代正藍，帶灰調的岩板藍
    { 
        id: 2, 
        bg: 'bg-[#6B7A8F]/15 dark:bg-[#6B7A8F]/20', 
        border: 'border-[#6B7A8F]/60', 
        text: 'text-[#3E4E5E] dark:text-[#D1DEE8]',
        badge: 'bg-[#6B7A8F] text-white',
        ring: 'ring-[#6B7A8F]'
    },
    // 4. Sage Green (The Analogous) - 柔和的鼠尾草綠
    { 
        id: 3, 
        bg: 'bg-[#7A9E7E]/15 dark:bg-[#7A9E7E]/20', 
        border: 'border-[#7A9E7E]/60', 
        text: 'text-[#2C4A30] dark:text-[#D6E8D8]',
        badge: 'bg-[#7A9E7E] text-white',
        ring: 'ring-[#7A9E7E]'
    },
    // 5. Dusty Lavender (The Mystery) - 帶灰調的薰衣草紫
    { 
        id: 4, 
        bg: 'bg-[#9D8189]/15 dark:bg-[#9D8189]/20', 
        border: 'border-[#9D8189]/60', 
        text: 'text-[#5E3F47] dark:text-[#E8D1D6]',
        badge: 'bg-[#9D8189] text-white',
        ring: 'ring-[#9D8189]'
    },
    // 6. Muted Teal (Brand Alignment) - 加深的品牌色變體
    { 
        id: 5, 
        bg: 'bg-[#4A857E]/10 dark:bg-[#4A857E]/20', 
        border: 'border-[#4A857E]/60', 
        text: 'text-[#1F3E4D] dark:text-[#B7E5CD]',
        badge: 'bg-[#4A857E] text-white',
        ring: 'ring-[#4A857E]'
    }
];

export const getUserTheme = (colorId: number | undefined) => {
    // Default to 0 if undefined
    const index = (colorId ?? 0) % USER_THEME_PALETTE.length;
    return USER_THEME_PALETTE[index];
};

// Helper for combined class string (Legacy compatibility)
export const getUserColorClasses = (colorId: number | undefined) => {
    const theme = getUserTheme(colorId);
    return `${theme.bg} ${theme.border} ${theme.text}`;
};

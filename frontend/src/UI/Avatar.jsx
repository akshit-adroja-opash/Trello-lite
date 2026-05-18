import React from 'react';

// Balanced, accessible palette optimized for light-slate themes
const COLORS = [
    '#4F46E5', // Indigo
    '#0EA5E9', // Sky Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Rose
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4'  // Cyan
];

const Avatar = ({ name = '?', avatar, size = 32 }) => {
    // Fallback if an empty string is passed as name
    const safeName = name && name.trim() ? name.trim() : '?';
    const initial = safeName.charAt(0).toUpperCase();
    
    // Hash function based on the name string to pick a consistent background color
    const getBgColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % COLORS.length;
        return COLORS[index];
    };

    const bg = getBgColor(safeName);

    // Common styling optimized for bright themes (clean slate border + subtle structural ring)
    const baseClassName = "rounded-full shrink-0 select-none object-cover border-2 border-slate-100 ring-1 ring-slate-200/50 shadow-sm";

    if (avatar) {
        return (
            <img 
                src={avatar} 
                alt={safeName} 
                title={safeName}
                style={{ width: size, height: size }}
                className={baseClassName} 
            />
        );
    }

    return (
        <div 
            title={safeName}
            style={{ 
                width: size, 
                height: size, 
                backgroundColor: bg, 
                fontSize: Math.max(10, size * 0.38) 
            }}
            className={`${baseClassName} flex items-center justify-center text-white font-bold`}
        >
            {initial}
        </div>
    );
};

export default Avatar;
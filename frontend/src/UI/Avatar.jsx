

import { useState, useEffect } from 'react';

const COLORS = [
    '#4F46E5', 
    '#0EA5E9', 
    '#10B981', 
    '#F59E0B', 
    '#EF4444', 
    '#8B5CF6', 
    '#EC4899', 
    '#06B6D4'  
];

const Avatar = ({ name = '?', avatar, size = 32 }) => {
    const [imgError, setImgError] = useState(false);
    const safeName = name && name.trim() ? name.trim() : '?';
    const initial = safeName.charAt(0).toUpperCase();

    useEffect(() => {
        setImgError(false);
    }, [avatar]);

    const getAvatarUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            return path;
        }
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const host = apiUrl.split('/api')[0];
        return `${host}${path.startsWith('/') ? '' : '/'}${path}`;
    };
    
    const getBgColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % COLORS.length;
        return COLORS[index];
    };

    const bg = getBgColor(safeName);

    const baseClassName = "rounded-full shrink-0 select-none object-cover border-2 border-slate-100 ring-1 ring-slate-200/50 shadow-sm";

    if (avatar && !imgError) {
        return (
            <img 
                src={getAvatarUrl(avatar)} 
                alt={safeName} 
                title={safeName}
                style={{ width: size, height: size }}
                className={baseClassName}
                onError={() => setImgError(true)}
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
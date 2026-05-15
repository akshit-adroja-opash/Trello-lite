const COLORS = ['#4F46E5','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];

const Avatar = ({ name = '?', avatar, size = 32 }) => {
    const initial = name.charAt(0).toUpperCase();
    const bg = COLORS[name.charCodeAt(0) % COLORS.length];

    if (avatar) return (
        <img src={avatar} alt={name} title={name}
            style={{ width: size, height: size }}
            className="rounded-full object-cover border-2 border-surface shrink-0" />
    );

    return (
        <div title={name}
            style={{ width: size, height: size, backgroundColor: bg, fontSize: Math.max(10, size * 0.38) }}
            className="rounded-full flex items-center justify-center text-white font-bold border-2 border-surface shrink-0 select-none">
            {initial}
        </div>
    );
};

export default Avatar;

import { Star } from './icons/HRTHISIcons';

interface AvatarDisplayProps {
  emoji?: string;
  level?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLevel?: boolean;
  className?: string;
  skinColor?: string;
  hairColor?: string;
  backgroundColor?: string;
}

export default function AvatarDisplay({
  emoji = '👤',
  level = 1,
  size = 'md',
  showLevel = true,
  className = '',
  skinColor,
  hairColor,
  backgroundColor = '#E5E7EB'
}: AvatarDisplayProps) {
  
  const sizeClasses = {
    xs: 'w-8 h-8 text-base',
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-20 h-20 text-4xl',
    xl: 'w-32 h-32 text-6xl'
  };

  const levelBadgeSizes = {
    xs: 'w-4 h-4 text-[8px]',
    sm: 'w-5 h-5 text-[9px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-7 h-7 text-sm',
    xl: 'w-10 h-10 text-base'
  };

  const getLevelColor = (lvl: number) => {
    if (lvl >= 10) return 'from-purple-500 to-pink-500';
    if (lvl >= 5) return 'from-blue-500 to-cyan-500';
    if (lvl >= 3) return 'from-green-500 to-emerald-500';
    return 'from-yellow-400 to-orange-500';
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Avatar Circle */}
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative overflow-hidden border-2 border-gray-200`}
        style={{
          backgroundColor: backgroundColor
        }}
      >
        {/* Emoji/Character */}
        <span className="relative z-10">{emoji}</span>
      </div>

      {/* Level Badge */}
      {showLevel && (
        <div
          className={`absolute -bottom-1 -right-1 ${levelBadgeSizes[size]} bg-gradient-to-br ${getLevelColor(level)} rounded-full flex items-center justify-center border-2 border-white shadow-lg`}
        >
          <span className="font-semibold text-white">{level}</span>
        </div>
      )}
    </div>
  );
}
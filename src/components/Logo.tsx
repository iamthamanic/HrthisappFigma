import logoImage from 'figma:asset/a2823359c8c61b8fadbc2fde9a656aa35cfcc7a7.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  // Sizes for the logo image
  const imageSizes = {
    sm: 'w-8 h-8',     // 32px
    md: 'w-12 h-12',   // 48px
    lg: 'w-16 h-16',   // 64px
  };

  return (
    <div className="flex items-center gap-2">
      {/* Logo Image - HRthis with lightning bolt */}
      <img 
        src={logoImage} 
        alt="HRthis Logo" 
        className={`${imageSizes[size]} object-contain scale-125`}
      />

      {/* Optional text "HRthis" */}
      {showText && (
        <span className="font-semibold text-gray-900">HRthis</span>
      )}
    </div>
  );
}
import logoImage from 'figma:asset/5218c77a6c85486efc0c8140c04aa2e0705a9753.png';
import iconImage from 'figma:asset/977ce9b38176278196339fab0cfdee728f38c4d1.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  // Sizes for the logo image
  const imageSizes = {
    sm: 'h-10',    // 40px height, auto width - optimal für Top Navbar
    md: 'h-12',    // 48px height, auto width
    lg: 'h-16',    // 64px height, auto width
  };

  return (
    <div className="flex items-center gap-2">
      {/* Logo Image - Browo Koordinator */}
      <img 
        src={logoImage} 
        alt="Browo Koordinator Logo" 
        className={`${imageSizes[size]} object-contain`}
      />
    </div>
  );
}

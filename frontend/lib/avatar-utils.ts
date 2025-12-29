/**
 * Utility functions for generating user avatars
 */

/**
 * Generate a color based on a string (address/username)
 */
export const generateColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a vibrant color
  const hue = hash % 360;
  const saturation = 65 + (hash % 20); // 65-85%
  const lightness = 50 + (hash % 15); // 50-65%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Get initials from a name or address
 */
export const getInitials = (name: string, address?: string): string => {
  if (name && name.includes('@')) {
    // Email address - use first letter before @
    return name.split('@')[0].charAt(0).toUpperCase();
  }
  
  if (name && name.length > 0 && !name.startsWith('0x')) {
    // Regular name - use first letter(s)
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  
  // Wallet address - use first and last character
  const addr = address || name;
  if (addr && addr.length >= 2) {
    return (addr[2] + addr[addr.length - 1]).toUpperCase();
  }
  
  return 'U';
};

/**
 * Generate avatar props for a user
 */
export interface AvatarProps {
  name: string;
  address?: string;
  picture?: string;
  size?: number;
}

export const getAvatarProps = ({ name, address, picture, size = 40 }: AvatarProps) => {
  // If user has a picture (e.g., from Google), use it
  if (picture) {
    return {
      type: 'image' as const,
      src: picture,
      alt: name,
      size,
    };
  }
  
  // Otherwise, generate a colored avatar with initials
  const color = generateColorFromString(address || name);
  const initials = getInitials(name, address);
  
  return {
    type: 'generated' as const,
    color,
    initials,
    size,
  };
};


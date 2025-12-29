'use client';

import { getAvatarProps } from '@/lib/avatar-utils';

interface AvatarProps {
  name: string;
  address?: string;
  picture?: string;
  size?: number;
  className?: string;
}

export default function Avatar({ name, address, picture, size = 40, className = '' }: AvatarProps) {
  const avatarProps = getAvatarProps({ name, address, picture, size });

  if (avatarProps.type === 'image') {
    return (
      <img
        src={avatarProps.src}
        alt={avatarProps.alt}
        className={`rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: avatarProps.color,
        fontSize: size * 0.4,
      }}
    >
      {avatarProps.initials}
    </div>
  );
}


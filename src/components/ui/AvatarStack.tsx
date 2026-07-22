import React from 'react';

interface AvatarStackProps {
  avatars: string[];
  count: number;
  size?: number;
}

const AVATAR_COLORS = [
  { bg: 'rgba(124,92,255,0.2)', text: '#7C5CFF' },
  { bg: 'rgba(0,230,118,0.2)', text: '#00E676' },
  { bg: 'rgba(255,77,141,0.2)', text: '#FF4D8D' },
  { bg: 'rgba(255,200,87,0.2)', text: '#FFC857' },
  { bg: 'rgba(0,201,167,0.2)', text: '#00C9A7' },
];

export default function AvatarStack({ avatars, count, size = 28 }: AvatarStackProps) {
  const visible = avatars.slice(0, 4);
  const overflow = count - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((initials, i) => {
        const colorIdx = i % AVATAR_COLORS.length;
        const colors = AVATAR_COLORS[colorIdx];
        return (
          <div
            key={`avatar-${initials}-${i}`}
            className="rounded-full flex items-center justify-center font-bold border-2"
            style={{
              width: size,
              height: size,
              fontSize: size * 0.35,
              background: colors.bg,
              color: colors.text,
              borderColor: 'var(--surface)',
              marginLeft: i === 0 ? 0 : -(size * 0.35),
              zIndex: visible.length - i,
            }}
          >
            {initials}
          </div>
        );
      })}
      {overflow > 0 && (
        <div
          className="rounded-full flex items-center justify-center font-semibold border-2"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.3,
            background: 'var(--elevated)',
            color: 'var(--muted-foreground)',
            borderColor: 'var(--surface)',
            marginLeft: -(size * 0.35),
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
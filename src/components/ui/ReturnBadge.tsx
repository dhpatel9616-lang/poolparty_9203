import React from 'react';

interface ReturnBadgeProps {
  weight: number;
}

export default function ReturnBadge({ weight }: ReturnBadgeProps) {
  let label = '';
  let color = '#B8B4C8';
  let bg = 'rgba(184,180,200,0.1)';

  if (weight === 0) {
    label = 'Even return';
    color = '#B8B4C8';
    bg = 'rgba(184,180,200,0.1)';
  } else if (weight === -110) {
    label = 'Lower return';
    color = '#FFC857';
    bg = 'rgba(255,200,87,0.1)';
  } else if (weight === 120) {
    label = 'Higher return';
    color = '#7C5CFF';
    bg = 'rgba(124,92,255,0.1)';
  } else if (weight === 250) {
    label = 'High return';
    color = '#00E676';
    bg = 'rgba(0,230,118,0.1)';
  } else if (weight > 0) {
    label = `+${weight} return`;
    color = '#7C5CFF';
    bg = 'rgba(124,92,255,0.1)';
  } else {
    label = `${weight} return`;
    color = '#FFC857';
    bg = 'rgba(255,200,87,0.1)';
  }

  return (
    <span
      className="pill-badge text-2xs font-semibold"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}
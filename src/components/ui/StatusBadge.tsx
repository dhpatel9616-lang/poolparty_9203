import React from 'react';

type Status = 'open' | 'locked' | 'resolved';

interface StatusBadgeProps {
  status: Status;
}

const STATUS_CONFIG: Record<Status, { color: string; bg: string; label: string; dot: string }> = {
  open: { color: '#00E676', bg: 'rgba(0,230,118,0.12)', label: 'Open', dot: '#00E676' },
  locked: { color: '#FFC857', bg: 'rgba(255,200,87,0.12)', label: 'Locked', dot: '#FFC857' },
  resolved: { color: '#B8B4C8', bg: 'rgba(184,180,200,0.12)', label: 'Resolved', dot: '#B8B4C8' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="pill-badge text-xs font-semibold flex items-center gap-1"
      style={{ color: config.color, background: config.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: config.dot }}
      />
      {config.label}
    </span>
  );
}
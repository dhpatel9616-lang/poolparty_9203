'use client';

import React from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  /** Controls visibility. Parent still owns the open/closed state. */
  isOpen: boolean;
  onClose: () => void;
  /** Optional header title. Omit for sheets that render their own custom header. */
  title?: string;
  /** Optional right-side header content (e.g. a secondary action) shown next to the close button. */
  headerRight?: React.ReactNode;
  /** Max height as a dvh value, e.g. 80 for '80dvh'. Defaults to 85. */
  maxHeightVh?: number;
  /** Hide the close (X) button — useful for sheets with fully custom headers. */
  hideCloseButton?: boolean;
  /** Disable click-outside-to-close (e.g. mid-flow forms where accidental dismissal is costly). */
  disableBackdropClose?: boolean;
  children: React.ReactNode;
  /** Extra classes for the inner scrollable content area. */
  contentClassName?: string;
}

/**
 * Shared bottom sheet / modal wrapper.
 *
 * Fixes the recurring bug where hand-rolled sheets across the app either:
 *  - used `vh` instead of `dvh`, causing content to get cut off by mobile
 *    browser chrome (address bar / keyboard), or
 *  - omitted `env(safe-area-inset-bottom)` padding, causing content to sit
 *    behind the iOS home indicator, or
 *  - omitted `overflow-y-auto` entirely, so tall content just clipped with
 *    no way to scroll to it.
 *
 * Every sheet in the app should render through this component instead of
 * reimplementing the backdrop/sheet/scroll/safe-area boilerplate.
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title,
  headerRight,
  maxHeightVh = 85,
  hideCloseButton = false,
  disableBackdropClose = false,
  children,
  contentClassName = '',
}: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={disableBackdropClose ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[390px] rounded-t-3xl flex flex-col"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: `${maxHeightVh}dvh`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          animation: 'fadeInUp 250ms ease forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" style={{ background: 'var(--border)' }} />

        {(title || headerRight || !hideCloseButton) && (
          <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            {title ? <h3 className="text-base font-bold text-foreground">{title}</h3> : <div />}
            <div className="flex items-center gap-2">
              {headerRight}
              {!hideCloseButton && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--elevated)' }}
                  aria-label="Close"
                >
                  <X size={14} style={{ color: 'var(--muted-foreground)' }} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`overflow-y-auto flex-1 px-4 py-4 pb-8 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useUIStore } from '@/state/uiStore';
import { useTranslation } from 'react-i18next';

export default function HamburgerButton() {
  const { toggleSidebar } = useUIStore();
  const { t } = useTranslation();
  
  return (
    <button
      aria-label={t('nav.openMenu')}
      onClick={toggleSidebar}
      className="p-2"
    >
      {/* Simple hamburger icon */}
      <span className="block w-6 h-0.5 bg-current mb-1" />
      <span className="block w-6 h-0.5 bg-current mb-1" />
      <span className="block w-6 h-0.5 bg-current" />
    </button>
  );
}

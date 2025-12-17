import React, { useEffect, useRef } from 'react';
import { useUIStore } from '@/state/uiStore';
import ProfileList from './ProfileList';
import SegmentList from './SegmentList';
import { useTranslation } from 'react-i18next';

export default function DrawerSidebar() {
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    const handleClick = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        closeSidebar();
      }
    };
    if (isSidebarOpen) {
      window.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handleClick);
    } else {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    }
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isSidebarOpen, closeSidebar]);

  return (
    <>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <div
        className="sidebar"
        role="dialog"
        aria-modal="true"
        ref={dialogRef}
        style={{
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          zIndex: 1000,
        }}
      >
        <div className="sidebar-header p-4 flex justify-between items-center border-b border-gray-700">
          <span className="text-lg font-semibold">{t('nav.menu')}</span>
          <button onClick={closeSidebar} aria-label={t('nav.closeMenu')} className="text-xl">
            ×
          </button>
        </div>
        <div className="sidebar-content h-full">
          <ProfileList />
          <div className="mt-4 border-t border-gray-700" />
          <SegmentList />
        </div>
      </div>
    </>
  );
}

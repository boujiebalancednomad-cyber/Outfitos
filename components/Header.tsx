import React from 'react';
import { SparklesIcon } from './icons';
import { ChromeStar } from './Clipart';
import type { Page } from '../App';

interface HeaderProps {
    activePage: Page;
    onPageChange: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ activePage, onPageChange }) => {
  return (
    <header className="bg-black border-b border-brand-blue/20 p-4 sticky top-0 z-40 shadow-glow-blue">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChromeStar className="w-8 h-8 animate-spin-slow" />
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-silver">
            OutfitOS
          </h1>
        </div>
        <nav className="flex items-center bg-neutral-900 p-1 rounded-lg">
            <button 
                onClick={() => onPageChange('fitboard')} 
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activePage === 'fitboard' ? 'bg-brand-blue text-white shadow-glow-blue-light' : 'text-neutral-300 hover:bg-neutral-800'}`}
            >
                Virtual Try-On
            </button>
            <button 
                onClick={() => onPageChange('enhancer')} 
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activePage === 'enhancer' ? 'bg-brand-blue text-white shadow-glow-blue-light' : 'text-neutral-300 hover:bg-neutral-800'}`}
            >
                Realism Enhancer
            </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
import React, { useState } from 'react';
import type { GeneratedImage } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { DiscoBall } from './Clipart';

interface SliderViewProps {
    images: GeneratedImage[];
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
}

const SliderView: React.FC<SliderViewProps> = ({ images, currentIndex, setCurrentIndex }) => {
    const prevSlide = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const nextSlide = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <div className="relative h-full w-full group">
            {images.length > 0 && (
                <div 
                    style={{ backgroundImage: `url(${images[currentIndex].src})`}} 
                    className="w-full h-full rounded-lg bg-center bg-cover duration-500"
                ></div>
            )}
             <div className="absolute top-1/2 -translate-y-1/2 left-2 text-2xl rounded-full p-2 bg-black/40 text-white cursor-pointer group-hover:opacity-100 opacity-0 transition-opacity" onClick={prevSlide}>
                <ChevronLeftIcon className="w-6 h-6" />
             </div>
             <div className="absolute top-1/2 -translate-y-1/2 right-2 text-2xl rounded-full p-2 bg-black/40 text-white cursor-pointer group-hover:opacity-100 opacity-0 transition-opacity" onClick={nextSlide}>
                <ChevronRightIcon className="w-6 h-6" />
             </div>
        </div>
    );
};


interface CollageViewProps {
    images: GeneratedImage[];
    activeTemplate: '2x2' | '3-panel';
    setActiveTemplate: (template: '2x2' | '3-panel') => void;
}

const CollageView: React.FC<CollageViewProps> = ({ images, activeTemplate, setActiveTemplate }) => {
    if (images.length === 0) return <div className="text-center text-neutral-500">No images to display.</div>;

    const templates = {
        '2x2': images.slice(0, 4),
        '3-panel': images.slice(0, 3)
    };

    const activeImages = templates[activeTemplate];

    const getGridClass = () => {
        if (activeTemplate === '2x2') return 'grid grid-cols-2 grid-rows-2 gap-2';
        return 'grid grid-cols-2 grid-rows-2 gap-2';
    };
    
    const getItemClass = (index: number) => {
        if (activeTemplate === '3-panel') {
            if (index === 0) return 'col-span-1 row-span-2';
            return 'col-span-1 row-span-1';
        }
        return 'col-span-1 row-span-1';
    };


    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex gap-2">
                 <button onClick={() => setActiveTemplate('2x2')} className={`px-3 py-1 text-sm rounded-md ${activeTemplate === '2x2' ? 'bg-brand-blue' : 'bg-neutral-800'}`}>2x2</button>
                 <button onClick={() => setActiveTemplate('3-panel')} className={`px-3 py-1 text-sm rounded-md ${activeTemplate === '3-panel' ? 'bg-brand-blue' : 'bg-neutral-800'}`}>3-Panel</button>
            </div>
            <div className="flex-grow">
                <div id="collage-container" className={getGridClass() + " h-full w-full"}>
                    {activeImages.map((img, index) => (
                        <div key={img.id} className={getItemClass(index)}>
                            <img src={img.src} alt={`Collage item ${index}`} className="w-full h-full object-cover rounded-md"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface ResultsViewerProps {
  generatedImages: GeneratedImage[];
  isLoading: boolean;
  outfitName: string;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({ generatedImages, isLoading, outfitName }) => {
  const [view, setView] = useState<'slider' | 'collage'>('slider');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState<'2x2' | '3-panel'>('2x2');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    const addBadge = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const scale = canvas.width / 512;
        const badgeWidth = 90 * scale;
        const badgeHeight = 20 * scale;
        const badgePadding = 10 * scale;
        const badgeX = canvas.width - badgeWidth - badgePadding;
        const badgeY = canvas.height - badgeHeight - badgePadding;
        const borderRadius = 5 * scale;

        ctx.beginPath();
        ctx.moveTo(badgeX + borderRadius, badgeY);
        ctx.lineTo(badgeX + badgeWidth - borderRadius, badgeY);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + borderRadius);
        ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - borderRadius);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - borderRadius, badgeY + badgeHeight);
        ctx.lineTo(badgeX + borderRadius, badgeY + badgeHeight);
        ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - borderRadius);
        ctx.lineTo(badgeX, badgeY + borderRadius);
        ctx.quadraticCurveTo(badgeX, badgeY, badgeX + borderRadius, badgeY);
        ctx.closePath();
        ctx.fill();

        ctx.font = `bold ${10 * scale}px "Share Tech Mono", monospace`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AI-edited', badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
    };

    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = src;
        });
    };

    try {
        if (view === 'slider' && generatedImages.length > 0) {
            const imageToDownload = generatedImages[currentIndex];
            const img = await loadImage(imageToDownload.src);

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            
            ctx.drawImage(img, 0, 0);
            addBadge(ctx, canvas);
            
            const link = document.createElement('a');
            link.download = `${outfitName}-image-${currentIndex + 1}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else if (view === 'collage' && generatedImages.length > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            
            ctx.fillStyle = '#171717';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const gap = 8;
            
            if (activeTemplate === '2x2' && generatedImages.length >= 2) { // Allow download even if not all 4 are there
                const images = await Promise.all(generatedImages.slice(0, 4).map(i => loadImage(i.src)));
                const w = (canvas.width - gap) / 2;
                const h = (canvas.height - gap) / 2;
                if(images[0]) ctx.drawImage(images[0], 0, 0, w, h);
                if(images[1]) ctx.drawImage(images[1], w + gap, 0, w, h);
                if(images[2]) ctx.drawImage(images[2], 0, h + gap, w, h);
                if(images[3]) ctx.drawImage(images[3], w + gap, h + gap, w, h);
            } else if (activeTemplate === '3-panel' && generatedImages.length > 0) {
                 const images = await Promise.all(generatedImages.slice(0, 3).map(i => loadImage(i.src)));
                const w = (canvas.width - gap) / 2;
                const h1 = canvas.height;
                const h2 = (canvas.height - gap) / 2;
                if(images[0]) ctx.drawImage(images[0], 0, 0, w, h1);
                if(images[1]) ctx.drawImage(images[1], w + gap, 0, w, h2);
                if(images[2]) ctx.drawImage(images[2], w + gap, h2 + gap, w, h2);
            }
            
            addBadge(ctx, canvas);
            
            const link = document.createElement('a');
            link.download = `${outfitName}-${activeTemplate}-collage.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    } catch (error) {
        console.error("Failed to download image:", error);
        alert("Could not download image. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };

  const content = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-blue mb-4"></div>
          <p className="text-lg font-semibold">Generating images for {outfitName}...</p>
          <p className="text-neutral-400">This may take a moment.</p>
        </div>
      );
    }
    if (generatedImages.length === 0) {
      return (
        <div className="flex flex-col gap-4 items-center justify-center h-full text-center text-neutral-500">
            <DiscoBall className="w-24 h-24 text-neutral-800 opacity-50" />
            <p>Your generated images will appear here.</p>
        </div>
      );
    }

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{outfitName} Results</h3>
                 <div className="flex items-center bg-neutral-900 p-1 rounded-lg">
                    <button onClick={() => setView('slider')} className={`px-3 py-1 text-sm rounded-md ${view === 'slider' ? 'bg-brand-blue' : ''}`}>Slider</button>
                    <button onClick={() => setView('collage')} className={`px-3 py-1 text-sm rounded-md ${view === 'collage' ? 'bg-brand-blue' : ''}`}>Collage</button>
                </div>
            </div>
            <div className="flex-grow h-0 min-h-0">
                {view === 'slider' && <SliderView images={generatedImages} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />}
                {view === 'collage' && <CollageView images={generatedImages} activeTemplate={activeTemplate} setActiveTemplate={setActiveTemplate} />}
            </div>
            <div className="text-center">
                 <button 
                    id="download-button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-brand-blue hover:bg-brand-blue/80 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDownloading ? 'Preparing...' : 'Download'}
                 </button>
                 <p className="text-xs text-neutral-500 mt-2">Downloads will include a small "AI-edited" badge.</p>
            </div>
        </div>
    );
  };

  return (
    <div className="p-4 bg-panel-bg rounded-lg h-full">
        {content()}
    </div>
  );
};

export default ResultsViewer;
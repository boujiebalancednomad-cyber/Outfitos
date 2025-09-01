import React, { useState } from 'react';
import { PlusIcon, SparklesIcon } from '../components/icons';
import { enhanceImageRealism } from '../services/geminiService';
import { ChromeHeart, ChromeStar } from '../components/Clipart';

interface UploaderProps {
  onUpload: (file: File) => void;
}

const Uploader: React.FC<UploaderProps> = ({ onUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };
  return (
    <div className="relative border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center hover:border-brand-blue transition-colors w-full h-full flex items-center justify-center">
      <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      <div className="flex flex-col items-center">
        <PlusIcon className="w-12 h-12 text-neutral-500 mb-4"/>
        <h3 className="text-lg font-semibold">Upload AI Photo</h3>
        <p className="text-sm text-neutral-400">Select an image to enhance with hyperrealism</p>
      </div>
    </div>
  );
};

const ImagePanel: React.FC<{ src?: string | null, title: string, isLoading?: boolean }> = ({ src, title, isLoading }) => (
    <div className="bg-panel-bg rounded-lg p-4 flex flex-col gap-3 h-full">
        <h2 className="text-lg font-bold text-center">{title}</h2>
        <div className="flex-grow bg-black rounded-md flex items-center justify-center overflow-hidden">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-blue mb-4"></div>
                    <p className="text-lg font-semibold">Enhancing Realism...</p>
                    <p className="text-neutral-400">This may take a moment.</p>
                </div>
            ) : src ? (
                <img src={src} alt={title} className="w-full h-full object-contain"/>
            ) : (
                <div className="flex flex-col items-center gap-4 text-neutral-500">
                    <ChromeHeart className="w-20 h-20 opacity-50"/>
                    <p>Image will appear here</p>
                </div>
            )}
        </div>
    </div>
);


const EnhancerPage: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{file: File, url: string} | null>(null);
    const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = (file: File) => {
        setOriginalImage({ file, url: URL.createObjectURL(file) });
        setEnhancedImage(null);
        setError(null);
    };

    const handleEnhance = async () => {
        if (!originalImage) {
            setError("Please upload an image first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setEnhancedImage(null);
        try {
            const resultUrl = await enhanceImageRealism(originalImage.file);
            setEnhancedImage(resultUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!enhancedImage) return;
        const link = document.createElement('a');
        link.href = enhancedImage;
        link.download = `enhanced-${originalImage?.file.name || 'image'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (!originalImage) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="w-full max-w-lg h-80 relative">
                    <ChromeStar className="w-12 h-12 absolute -top-4 -left-4 opacity-50 rotate-12 pointer-events-none" />
                    <ChromeStar className="w-8 h-8 absolute -bottom-8 -right-4 opacity-50 -rotate-12 pointer-events-none" />
                    <Uploader onUpload={handleUpload} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow h-0 min-h-0">
                <ImagePanel src={originalImage.url} title="Before" />
                <ImagePanel src={enhancedImage} title="After" isLoading={isLoading} />
            </div>
            {error && <p className="text-center text-red-500">{error}</p>}
            <div className="flex-shrink-0 flex items-center justify-center gap-4">
                 <button 
                    onClick={() => setOriginalImage(null)}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                >
                    Upload New
                </button>
                <button 
                    onClick={handleEnhance} 
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-brand-blue to-brand-silver text-black font-bold py-3 px-8 rounded-lg hover:opacity-90 hover:shadow-glow-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <SparklesIcon className="w-5 h-5"/>
                  {isLoading ? 'Enhancing...' : 'Enhance'}
                </button>
                <button 
                    onClick={handleDownload}
                    disabled={!enhancedImage || isLoading}
                    className="bg-brand-blue hover:bg-brand-blue/80 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Download
                </button>
            </div>
        </div>
    );
};

export default EnhancerPage;
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Model, Outfit, StoryboardElement, GeneratedImage, Hairstyle } from '../types';
import SetupPanel from '../components/SetupPanel';
import StoryboardCanvas from '../components/StoryboardCanvas';
import ResultsViewer from '../components/ResultsViewer';
import { generateTryOnImages, analyzeModel, analyzeHairstyle } from '../services/geminiService';
import { SparklesIcon, LockClosedIcon } from '../components/icons';
import { ChromeStar, ChromeHeart, ChromeButterfly } from '../components/Clipart';

const FitBoardPage: React.FC = () => {
  const [model, setModel] = useState<Model | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [hairstyle, setHairstyle] = useState<Hairstyle | null>(null);
  const [storyboardElements, setStoryboardElements] = useState<StoryboardElement[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeOutfitId, setActiveOutfitId] = useState<string | null>(null);
  const [lockFace, setLockFace] = useState(true);

  const handleGenerate = useCallback(async () => {
    if (!model) {
      alert("Please upload a model.");
      return;
    }
    
    if (!process.env.API_KEY) {
        alert("API_KEY environment variable not set.");
        return;
    }

    const jobs: Outfit[] = outfits.filter(o => o.garments.length > 0);
    
    // If no outfits with garments, but there is a hairstyle, create a job for it
    if (jobs.length === 0 && hairstyle) {
        jobs.push({ id: 'hairstyle-only', name: 'Hairstyle Try-On', garments: [] });
    } else if (jobs.length === 0) {
        alert("Please upload an outfit or a hairstyle to generate an image.");
        return;
    }
    
    setIsLoading(true);
    const instructions = storyboardElements
      .filter(el => el.type === 'note')
      .map(el => el.content)
      .join(' ');
      
    // Clear previous results for a clean slate
    setGeneratedImages({});
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Pre-analyze model and hairstyle once to avoid redundant API calls
    const modelAnalysis = await analyzeModel(ai, model);
    const hairstyleAnalysis = await analyzeHairstyle(ai, hairstyle);

    for (const job of jobs) {
      setActiveOutfitId(job.id);
      try {
        const images = await generateTryOnImages(
            ai, 
            model, 
            job, 
            hairstyle, 
            instructions, 
            lockFace,
            modelAnalysis,
            hairstyleAnalysis
        );
        setGeneratedImages(prev => ({
          ...prev,
          [job.id]: images.map((src, index) => ({ id: `${job.id}-${index}`, src })),
        }));
      } catch (error) {
        console.error(`Failed to generate images for ${job.name}`, error);
      }
    }
    
    setIsLoading(false);
    if (jobs.length > 0) {
        setActiveOutfitId(jobs[0].id);
    }
  }, [model, outfits, hairstyle, storyboardElements, lockFace]);

  const canGenerate = model && (hairstyle || outfits.some(o => o.garments.length > 0));
  
  const getActiveOutfitName = () => {
    if (!activeOutfitId) return '';
    const activeOutfit = outfits.find(o => o.id === activeOutfitId);
    if (activeOutfit) return activeOutfit.name;
    if (activeOutfitId === 'hairstyle-only') return 'Hairstyle Try-On';
    return '';
  };
  
  return (
    <div className="relative h-full">
      <ChromeStar className="w-24 h-24 absolute top-10 left-1/3 opacity-10 -z-10 animate-spin-slow pointer-events-none" />
      <ChromeHeart className="w-20 h-20 absolute bottom-1/4 right-1/4 opacity-10 -z-10 pointer-events-none" />
      <ChromeButterfly className="w-16 h-16 absolute top-1/2 left-1/4 opacity-10 -z-10 transform -scale-x-100 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
        <div className="lg:col-span-3 h-full">
          <SetupPanel 
            model={model} 
            outfits={outfits} 
            hairstyle={hairstyle}
            onModelChange={setModel} 
            onOutfitsChange={setOutfits}
            onHairstyleChange={setHairstyle}
          />
        </div>
        <div className="lg:col-span-6 h-full flex flex-col gap-4">
            <div className="flex justify-between items-center p-4 bg-panel-bg rounded-lg">
                <h2 className="text-lg font-bold">4. Add Creative Direction</h2>
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <LockClosedIcon className={`w-5 h-5 ${lockFace ? 'text-brand-blue' : 'text-neutral-500'}`} />
                        <span className="text-sm font-medium">Lock Face Consistency</span>
                         <button onClick={() => setLockFace(!lockFace)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${lockFace ? 'bg-brand-blue' : 'bg-neutral-600'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${lockFace ? 'translate-x-6' : 'translate-x-1'}`}/>
                        </button>
                    </div>
                    <button 
                        onClick={handleGenerate} 
                        disabled={!canGenerate || isLoading}
                        className="flex items-center gap-2 bg-gradient-to-r from-brand-blue to-brand-silver text-black font-bold py-2 px-6 rounded-lg hover:opacity-90 hover:shadow-glow-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <SparklesIcon className="w-5 h-5"/>
                      {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>
            <div className="flex-grow">
              <StoryboardCanvas elements={storyboardElements} onElementsChange={setStoryboardElements} />
            </div>
        </div>
        <div className="lg:col-span-3 h-full">
          <ResultsViewer 
            isLoading={isLoading && !!activeOutfitId} 
            outfitName={getActiveOutfitName()}
            generatedImages={activeOutfitId ? generatedImages[activeOutfitId] || [] : []}
          />
        </div>
      </div>
    </div>
  );
};

export default FitBoardPage;
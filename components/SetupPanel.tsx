import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop } from 'react-image-crop';
import type { Model, Outfit, Garment, Hairstyle } from '../types';
import { PlusIcon, TrashIcon, CropIcon, FaceIcon, ArrowUturnLeftIcon } from './icons';
import { ChromeStar, ChromeHeart, ChromeButterfly } from './Clipart';
import { blurFaceInImage } from '../services/geminiService';

interface SetupPanelProps {
  model: Model | null;
  outfits: Outfit[];
  hairstyle: Hairstyle | null;
  onModelChange: (model: Model | null) => void;
  onOutfitsChange: (outfits: Outfit[]) => void;
  onHairstyleChange: (hairstyle: Hairstyle | null) => void;
}

// Helper function to crop the image using canvas
function getCroppedImg(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      return Promise.reject(new Error('Could not get canvas context'));
    }
  
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
  
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(new File([blob], fileName, { type: blob.type }));
        },
        'image/png',
        1
      );
    });
}

const Uploader: React.FC<{ onUpload: (file: File) => void, title: string, subtitle: string }> = ({ onUpload, title, subtitle }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };
  return (
    <div className="relative border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center hover:border-brand-blue transition-colors">
      <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      <div className="flex flex-col items-center">
        <PlusIcon className="w-8 h-8 text-neutral-500 mb-2"/>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-neutral-400">{subtitle}</p>
      </div>
    </div>
  );
};

const SetupPanel: React.FC<SetupPanelProps> = ({ model, outfits, hairstyle, onModelChange, onOutfitsChange, onHairstyleChange }) => {
  const [draggedOutfitIndex, setDraggedOutfitIndex] = useState<number | null>(null);
  const [croppingGarment, setCroppingGarment] = useState<{ outfitId: string; garment: Garment } | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isBlurring, setIsBlurring] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleModelUpload = (file: File) => {
    onModelChange({ file, previewUrl: URL.createObjectURL(file) });
  };
  
  const handleHairstyleUpload = (file: File) => {
    onHairstyleChange({
        file,
        previewUrl: URL.createObjectURL(file),
        originalFile: file,
        originalPreviewUrl: URL.createObjectURL(file),
        isBlurred: false,
     });
  };

  const handleGarmentUpload = (file: File, outfitId: string) => {
    const newGarment: Garment = { 
        id: Date.now().toString(), 
        file, 
        previewUrl: URL.createObjectURL(file),
        originalFile: file,
        originalPreviewUrl: URL.createObjectURL(file)
    };
    const updatedOutfits = outfits.map(o => 
      o.id === outfitId ? { ...o, garments: [...o.garments, newGarment].slice(0, 6) } : o
    );
    onOutfitsChange(updatedOutfits);
  };
  
  const addOutfit = () => {
    if (outfits.length < 3) {
      const newOutfit: Outfit = { id: Date.now().toString(), name: `Outfit ${outfits.length + 1}`, garments: [] };
      onOutfitsChange([...outfits, newOutfit]);
    }
  };

  const removeOutfit = (outfitId: string) => {
    onOutfitsChange(outfits.filter(o => o.id !== outfitId));
  };

  const removeGarment = (outfitId: string, garmentId: string) => {
    const updatedOutfits = outfits.map(o => 
      o.id === outfitId ? { ...o, garments: o.garments.filter(g => g.id !== garmentId) } : o
    );
    onOutfitsChange(updatedOutfits);
  };
  
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedOutfitIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if(draggedOutfitIndex === null || draggedOutfitIndex === index) return;
    
    const newOutfits = [...outfits];
    const draggedItem = newOutfits.splice(draggedOutfitIndex, 1)[0];
    newOutfits.splice(index, 0, draggedItem);
    setDraggedOutfitIndex(index);
    onOutfitsChange(newOutfits);
  };
  
  const onDragEnd = () => {
    setDraggedOutfitIndex(null);
  };

  const handleCropClick = (outfitId: string, garment: Garment) => {
    setCroppingGarment({ outfitId, garment });
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current || !croppingGarment) return;
    try {
      const croppedImageFile = await getCroppedImg(imgRef.current, completedCrop, croppingGarment.garment.originalFile.name);
      const updatedOutfits = outfits.map(o => {
        if (o.id === croppingGarment.outfitId) {
          return {
            ...o,
            garments: o.garments.map(g =>
              g.id === croppingGarment.garment.id
                ? { ...g, file: croppedImageFile, previewUrl: URL.createObjectURL(croppedImageFile) }
                : g
            )
          };
        }
        return o;
      });
      onOutfitsChange(updatedOutfits);
      setCroppingGarment(null);
    } catch (e) {
      console.error("Cropping failed: ", e);
    }
  };
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      {
        unit: '%',
        width: 90,
        height: 90,
      },
      width,
      height
    );
    setCrop(crop);
  }
  
    const handleBlurFace = async () => {
      if (!hairstyle) return;
      setIsBlurring(true);
      try {
          const blurredFile = await blurFaceInImage(hairstyle.originalFile);
          onHairstyleChange({
              ...hairstyle,
              file: blurredFile,
              previewUrl: URL.createObjectURL(blurredFile),
              isBlurred: true,
          });
      } catch (error) {
          console.error("Failed to blur face:", error);
          alert("Could not blur face in the image. Please try again.");
      } finally {
          setIsBlurring(false);
      }
  };

  const handleRevertBlur = () => {
      if (!hairstyle) return;
      onHairstyleChange({
          ...hairstyle,
          file: hairstyle.originalFile,
          previewUrl: hairstyle.originalPreviewUrl,
          isBlurred: false,
      });
  };

  return (
    <>
     {croppingGarment && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-brand-blue/20 p-6 rounded-lg max-w-2xl w-full flex flex-col gap-4">
            <h3 className="text-xl font-bold">Crop Garment</h3>
            <div className="max-h-[60vh] overflow-auto flex justify-center bg-black rounded-md">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
              >
                <img ref={imgRef} alt="Crop preview" src={croppingGarment.garment.originalPreviewUrl} onLoad={onImageLoad} style={{maxHeight: '60vh'}} />
              </ReactCrop>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={() => setCroppingGarment(null)} className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
              <button onClick={handleSaveCrop} className="bg-brand-blue hover:bg-brand-blue/80 text-white font-bold py-2 px-4 rounded-lg">Save Crop</button>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 bg-panel-bg rounded-lg h-full overflow-y-auto flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <ChromeStar className="w-5 h-5 text-brand-silver" />
            1. Upload Model
          </h2>
          {model ? (
            <div className="relative group">
              <img src={model.previewUrl} alt="Model" className="w-full h-auto object-cover rounded-lg"/>
              <button onClick={() => onModelChange(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100">
                <TrashIcon className="w-4 h-4"/>
              </button>
            </div>
          ) : (
            <Uploader onUpload={handleModelUpload} title="Upload Model Photo" subtitle="PNG or JPG"/>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <ChromeHeart className="w-5 h-5 text-brand-silver" />
                2. Create outfit
            </h2>
            <button onClick={addOutfit} disabled={outfits.length >= 3} className="flex items-center gap-1 text-sm bg-brand-blue hover:bg-brand-blue/80 disabled:bg-neutral-700 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition-colors">
              <PlusIcon className="w-4 h-4"/> Add
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {outfits.map((outfit, index) => (
              <div 
                key={outfit.id} 
                className="bg-black p-4 rounded-lg border border-neutral-800 cursor-grab"
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">{outfit.name}</h3>
                  <button onClick={() => removeOutfit(outfit.id)} className="text-neutral-400 hover:text-red-500">
                    <TrashIcon className="w-5 h-5"/>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {outfit.garments.map(garment => (
                    <div key={garment.id} className="relative group aspect-square">
                      <img src={garment.previewUrl} alt="Garment" className="w-full h-full object-cover rounded-md"/>
                      <div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleCropClick(outfit.id, garment)} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-brand-blue" aria-label="Crop garment">
                            <CropIcon className="w-4 h-4"/>
                        </button>
                        <button onClick={() => removeGarment(outfit.id, garment.id)} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-red-600" aria-label="Remove garment">
                          <TrashIcon className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {outfit.garments.length < 6 && (
                    <div className="aspect-square">
                       <Uploader onUpload={(file) => handleGarmentUpload(file, outfit.id)} title="Add Item" subtitle="Max 6"/>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <ChromeButterfly className="w-5 h-5 text-brand-silver" />
                3. Upload Hairstyle (Optional)
            </h2>
            {hairstyle ? (
                <div className="relative group w-full">
                    <img src={hairstyle.previewUrl} alt="Hairstyle" className="w-full h-auto object-cover rounded-lg"/>
                    {isBlurring && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                            <p className="text-sm mt-2">Blurring face...</p>
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                        <button onClick={() => onHairstyleChange(null)} className="p-1.5 bg-black/50 rounded-full text-white hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100" disabled={isBlurring}>
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                        {hairstyle.isBlurred ? (
                            <button onClick={handleRevertBlur} title="Revert Blur" className="p-1.5 bg-black/50 rounded-full text-white hover:bg-brand-blue transition-opacity opacity-0 group-hover:opacity-100" disabled={isBlurring} aria-label="Revert face blur">
                                <ArrowUturnLeftIcon className="w-4 h-4"/>
                            </button>
                        ) : (
                            <button onClick={handleBlurFace} title="Blur Face in Image" className="p-1.5 bg-black/50 rounded-full text-white hover:bg-brand-blue transition-opacity opacity-0 group-hover:opacity-100" disabled={isBlurring} aria-label="Blur face in image">
                                <FaceIcon className="w-4 h-4"/>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <Uploader onUpload={handleHairstyleUpload} title="Upload Hairstyle Photo" subtitle="PNG or JPG"/>
            )}
        </div>

      </div>
    </>
  );
};

export default SetupPanel;

export interface Garment {
  id: string;
  file: File; // The current (possibly cropped) file
  previewUrl: string; // The preview URL for the current file
  originalFile: File; // The original uploaded file, for re-cropping
  originalPreviewUrl: string; // The preview URL for the original file
}

export interface Outfit {
  id:string;
  name: string;
  garments: Garment[];
}

export interface Model {
  file: File;
  previewUrl: string;
}

export interface Hairstyle {
  file: File; // The current (possibly blurred) file
  previewUrl: string; // The preview URL for the current file
  originalFile: File; // The original uploaded file, for reverting blur
  originalPreviewUrl: string; // The preview URL for the original file
  isBlurred: boolean;
}

export interface StoryboardElement {
  id: string;
  type: 'note';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GeneratedImage {
    id: string;
    src: string;
}
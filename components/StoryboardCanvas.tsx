
import React, { useState, useRef, useEffect } from 'react';
import type { StoryboardElement } from '../types';
import { NoteIcon } from './icons';

interface StoryboardCanvasProps {
  elements: StoryboardElement[];
  onElementsChange: (elements: StoryboardElement[]) => void;
}

const DraggableNote: React.FC<{
  element: StoryboardElement,
  onUpdate: (id: string, newProps: Partial<StoryboardElement>) => void,
  onDelete: (id: string) => void,
}> = ({ element, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    // Only drag on the header
    if ((e.target as HTMLElement).id !== 'drag-handle') return;

    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - element.x,
      y: e.clientY - element.y,
    };
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    onUpdate(element.id, { x: e.clientX - dragStartPos.current.x, y: e.clientY - dragStartPos.current.y });
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <div
      ref={noteRef}
      className="absolute bg-brand-blue/10 border border-brand-blue/50 backdrop-blur-sm text-neutral-100 shadow-lg rounded-md p-2 flex flex-col"
      style={{ left: element.x, top: element.y, width: element.width, height: element.height, cursor: isDragging ? 'grabbing' : 'default' }}
    >
      <div 
        id="drag-handle"
        className="flex justify-end items-center text-brand-silver/70 cursor-grab pb-1"
        onMouseDown={onMouseDown}
      >
        <button onClick={() => onDelete(element.id)} className="text-xs hover:text-white">✕</button>
      </div>
      <textarea
        value={element.content}
        onChange={(e) => onUpdate(element.id, { content: e.target.value })}
        className="bg-transparent resize-none w-full h-full outline-none text-sm placeholder-neutral-500/70"
        placeholder="Type instructions... e.g., 'Golden hour lighting, outdoor cafe scene.'"
      />
    </div>
  );
};

const StoryboardCanvas: React.FC<StoryboardCanvasProps> = ({ elements, onElementsChange }) => {
  const addNote = () => {
    const newNote: StoryboardElement = {
      id: Date.now().toString(),
      type: 'note',
      content: '',
      x: 50,
      y: 50,
      width: 200,
      height: 150,
    };
    onElementsChange([...elements, newNote]);
  };

  const updateElement = (id: string, newProps: Partial<StoryboardElement>) => {
    onElementsChange(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  };
  
  const deleteElement = (id: string) => {
    onElementsChange(elements.filter(el => el.id !== id));
  };

  return (
    <div className="relative bg-panel-bg rounded-lg h-full w-full overflow-hidden border border-neutral-800">
      <div className="absolute top-0 left-0 p-4 z-10">
        <button onClick={addNote} className="flex items-center gap-2 bg-neutral-800 hover:bg-brand-blue text-white px-4 py-2 rounded-md transition-colors">
          <NoteIcon className="w-5 h-5"/>
          Add Note
        </button>
      </div>
      <div className="absolute inset-0 p-4">
        {elements.map(el => (
          <DraggableNote key={el.id} element={el} onUpdate={updateElement} onDelete={deleteElement}/>
        ))}
      </div>
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-neutral-700 text-center font-semibold tracking-wider">
            {elements.length === 0 ? "ADD NOTES FOR CREATIVE DIRECTION" : ""}
        </p>
    </div>
    </div>
  );
};

export default StoryboardCanvas;
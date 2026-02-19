import React, { useRef, useEffect } from 'react';
import { Subtitle } from '../types';
import { formatTime } from '../utils/time';

interface EditorProps {
  subtitles: Subtitle[];
  currentTime: number;
  onUpdateSubtitle: (id: string, updates: Partial<Subtitle>) => void;
  onDeleteSubtitle: (id: string) => void;
  onAddSubtitle: () => void;
  onSeek: (time: number) => void;
}

export const Editor: React.FC<EditorProps> = ({
  subtitles,
  currentTime,
  onUpdateSubtitle,
  onDeleteSubtitle,
  onAddSubtitle,
  onSeek
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active subtitle
  useEffect(() => {
    const activeIndex = subtitles.findIndex(s => currentTime >= s.startTime && currentTime <= s.endTime);
    if (activeIndex !== -1 && scrollRef.current) {
      const el = scrollRef.current.children[activeIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, subtitles]); // Added subtitles to deps to ensure index validity

  return (
    <div className="flex flex-col h-full bg-brand-900/50 rounded-lg border border-brand-800">
      <div className="p-4 border-b border-brand-800 flex justify-between items-center bg-brand-900">
        <h3 className="font-bold text-gray-200">Legendas ({subtitles.length})</h3>
        <button 
          onClick={onAddSubtitle}
          className="px-3 py-1 bg-brand-600 hover:bg-brand-500 rounded text-sm font-semibold transition"
        >
          + Adicionar
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2" ref={scrollRef}>
        {subtitles.length === 0 && (
          <div className="text-center text-gray-500 mt-10 text-sm p-4">
            Nenhuma legenda. Importe via IA ou adicione manualmente.
          </div>
        )}
        
        {subtitles.map((sub) => {
          const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
          return (
            <div 
              key={sub.id}
              className={`p-3 rounded border transition-all duration-200 ${isActive ? 'bg-brand-800 border-brand-500 shadow-md transform scale-[1.01]' : 'bg-brand-900 border-brand-800 hover:border-brand-600'}`}
            >
              <div className="flex gap-2 mb-2">
                <div className="flex-1 flex gap-1">
                  <input
                    type="number"
                    step="0.1"
                    className="w-20 bg-brand-950 border border-brand-700 rounded px-2 py-1 text-xs text-brand-100 font-mono"
                    value={sub.startTime}
                    onChange={(e) => onUpdateSubtitle(sub.id, { startTime: parseFloat(e.target.value) })}
                  />
                  <span className="text-gray-500 self-center">→</span>
                  <input
                    type="number"
                    step="0.1"
                    className="w-20 bg-brand-950 border border-brand-700 rounded px-2 py-1 text-xs text-brand-100 font-mono"
                    value={sub.endTime}
                    onChange={(e) => onUpdateSubtitle(sub.id, { endTime: parseFloat(e.target.value) })}
                  />
                </div>
                <button 
                  onClick={() => onSeek(sub.startTime)}
                  className="text-gray-400 hover:text-white px-2"
                  title="Ir para tempo"
                >
                  ▶
                </button>
                <button 
                  onClick={() => onDeleteSubtitle(sub.id)}
                  className="text-red-900 hover:text-red-500 px-2"
                  title="Excluir"
                >
                  ×
                </button>
              </div>
              <textarea
  className="w-full bg-transparent border-none text-sm text-gray-200 focus:ring-0 resize-none p-0 focus:text-white"
  style={{ whiteSpace: 'pre-wrap' }} // Adicione isso aqui
  rows={2}
  value={sub.text}
  onChange={(e) => onUpdateSubtitle(sub.id, { text: e.target.value })}
  placeholder="Texto da legenda..."
/>
            </div>
          );
        })}
      </div>
    </div>
  );
};
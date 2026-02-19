import React, { useRef, useEffect } from 'react';
import { Subtitle, StyleConfig } from '../types'; // Importe StyleConfig aqui
import { formatTime } from '../utils/time';

interface EditorProps {
  subtitles: Subtitle[];
  currentTime: number;
  onUpdateSubtitle: (id: string, updates: Partial<Subtitle>) => void;
  onDeleteSubtitle: (id: string) => void;
  onAddSubtitle: () => void;
  onSeek: (time: number) => void;
  styleConfig: StyleConfig; // Adicionado corretamente
}

export const Editor: React.FC<EditorProps> = ({
  subtitles,
  currentTime,
  onUpdateSubtitle,
  onDeleteSubtitle,
  onAddSubtitle,
  onSeek,
  styleConfig
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIndex = subtitles.findIndex(s => currentTime >= s.startTime && currentTime <= s.endTime);
    if (activeIndex !== -1 && scrollRef.current) {
      const el = scrollRef.current.children[activeIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, subtitles]);

  return (
    <div className="flex flex-col h-full bg-brand-900/50 rounded-lg border border-brand-800">
      <div className="p-4 border-b border-brand-800 flex justify-between items-center">
        <h2 className="font-bold text-brand-100">Editor de Legendas</h2>
        <button 
          onClick={onAddSubtitle}
          className="bg-brand-500 hover:bg-brand-400 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          + Nova Legenda
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {subtitles.map((sub) => {
          const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
          
          // Lógica do Limitador Inteligente
          const lines = sub.text.split('\n');
          const hasLineExceeded = lines.some(line => line.length > (styleConfig.maxCharsPerLine || 39));
          const hasTotalExceeded = sub.text.length > (styleConfig.maxCharsPerSubtitle || 95);
          const isOverLimit = hasLineExceeded || hasTotalExceeded;

          return (
            <div 
              key={sub.id}
              className={`p-3 rounded border transition-all ${
                isOverLimit ? 'border-red-500 bg-red-900/20' : 
                isActive ? 'bg-brand-800 border-brand-500' : 'bg-brand-900 border-brand-800'
              }`}
            >
              <div className="flex justify-between mb-2">
                <div className="flex gap-2 text-xs">
                  <input
                    type="number"
                    step="0.1"
                    className="w-20 bg-brand-950 border border-brand-700 rounded px-2 py-1 text-brand-100 font-mono"
                    value={sub.startTime}
                    onChange={(e) => onUpdateSubtitle(sub.id, { startTime: parseFloat(e.target.value) })}
                  />
                  <span className="text-gray-500 self-center">→</span>
                  <input
                    type="number"
                    step="0.1"
                    className="w-20 bg-brand-950 border border-brand-700 rounded px-2 py-1 text-brand-100 font-mono"
                    value={sub.endTime}
                    onChange={(e) => onUpdateSubtitle(sub.id, { endTime: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onSeek(sub.startTime)} className="text-gray-400 hover:text-white px-1">▶</button>
                  <button onClick={() => onDeleteSubtitle(sub.id)} className="text-red-900 hover:text-red-500 px-1">×</button>
                </div>
              </div>

              <textarea
                className={`w-full bg-transparent border-none text-sm focus:ring-0 resize-none p-0 transition-colors ${
                  isOverLimit ? 'text-red-200' : 'text-gray-200 focus:text-white'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
                rows={2}
                value={sub.text}
                onChange={(e) => onUpdateSubtitle(sub.id, { text: e.target.value })}
                placeholder="Texto da legenda..."
              />

              {isOverLimit && (
                <div className="text-[10px] text-red-400 mt-1 font-bold uppercase tracking-wider">
                  {hasLineExceeded ? '⚠️ Linha muito longa!' : '⚠️ Limite total excedido!'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
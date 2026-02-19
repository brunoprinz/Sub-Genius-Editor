import React from 'react';
import { StyleConfig } from '../types';

interface StyleControlsProps {
  config: StyleConfig;
  onChange: (newConfig: StyleConfig) => void;
}

export const StyleControls: React.FC<StyleControlsProps> = ({ config, onChange }) => {
  
  const handleChange = (key: keyof StyleConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-brand-900/50 rounded-lg border border-brand-800 text-sm">
      {/* Grade Principal de Controles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs uppercase font-bold">Fonte</label>
          <select 
            className="bg-brand-950 border border-brand-700 rounded px-2 py-1"
            value={config.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
          >
            <option value="Roboto">Roboto</option>
            <option value="Arial">Arial</option>
            <option value="Impact">Impact</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs uppercase font-bold">Tamanho (px)</label>
          <input 
            type="number" 
            className="bg-brand-950 border border-brand-700 rounded px-2 py-1"
            value={config.fontSize}
            onChange={(e) => handleChange('fontSize', Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs uppercase font-bold">Posição</label>
          <select 
            className="bg-brand-950 border border-brand-700 rounded px-2 py-1"
            value={config.verticalAlign}
            onChange={(e) => handleChange('verticalAlign', e.target.value as any)}
          >
            <option value="bottom">Inferior</option>
            <option value="top">Superior</option>
            <option value="center">Centro</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs uppercase font-bold">Margem V</label>
          <input 
            type="range" min="0" max="200" className="accent-brand-500 h-8"
            value={config.bottomMargin}
            onChange={(e) => handleChange('bottomMargin', Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-1 col-span-2">
           <label className="text-gray-400 text-xs uppercase font-bold">Fundo e Opacidade</label>
           <div className="flex gap-2">
              <input type="color" value={config.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} className="w-8 h-8 bg-transparent cursor-pointer"/>
              <input type="range" min="0" max="255" className="flex-1 accent-brand-500" value={config.backgroundOpacity} onChange={(e) => handleChange('backgroundOpacity', Number(e.target.value))}/>
           </div>
        </div>
      </div>

      {/* Nova Seção: Limites de Caracteres (O Padrão Netflix) */}
      <div className="border-t border-brand-800 pt-4 mt-2 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-brand-400 text-xs uppercase font-bold">Máx. Caracteres por Linha</label>
          <input
            type="number"
            value={config.maxCharsPerLine || 39}
            onChange={(e) => handleChange('maxCharsPerLine', parseInt(e.target.value))}
            className="bg-brand-950 border border-brand-700 rounded px-2 py-1 text-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-brand-400 text-xs uppercase font-bold">Máx. Total por Legenda</label>
          <input
            type="number"
            value={config.maxCharsPerSubtitle || 95}
            onChange={(e) => handleChange('maxCharsPerSubtitle', parseInt(e.target.value))}
            className="bg-brand-950 border border-brand-700 rounded px-2 py-1 text-white"
          />
        </div>
      </div>
    </div>
  );
};
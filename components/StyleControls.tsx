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
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-brand-900/50 rounded-lg border border-brand-800 text-sm">
      
      <div className="flex flex-col gap-1">
        <label className="text-gray-400 text-xs uppercase font-bold">Fonte</label>
        <select 
          className="bg-brand-950 border border-brand-700 rounded px-2 py-1"
          value={config.fontFamily}
          onChange={(e) => handleChange('fontFamily', e.target.value)}
        >
          <option value="Roboto">Roboto (Padrão)</option>
          <option value="Arial">Arial</option>
          <option value="Verdana">Verdana</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
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
        <label className="text-gray-400 text-xs uppercase font-bold">Cor Texto</label>
        <div className="flex gap-2 items-center">
          <input 
            type="color" 
            className="w-8 h-8 rounded cursor-pointer bg-transparent"
            value={config.color}
            onChange={(e) => handleChange('color', e.target.value)}
          />
          <span className="text-xs text-gray-400 font-mono">{config.color}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-gray-400 text-xs uppercase font-bold">Borda</label>
        <div className="flex gap-2 items-center">
          <input 
            type="color" 
            className="w-6 h-8 rounded cursor-pointer bg-transparent"
            value={config.outlineColor}
            onChange={(e) => handleChange('outlineColor', e.target.value)}
          />
          <input 
            type="number"
            min="0" max="10" 
            className="w-full bg-brand-950 border border-brand-700 rounded px-2 py-1"
            value={config.outlineWidth}
            onChange={(e) => handleChange('outlineWidth', Number(e.target.value))}
          />
        </div>
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
          type="range"
          min="0" max="200"
          className="accent-brand-500 h-8"
          value={config.bottomMargin}
          onChange={(e) => handleChange('bottomMargin', Number(e.target.value))}
        />
      </div>
      
      <div className="flex flex-col gap-1 col-span-2">
         <label className="text-gray-400 text-xs uppercase font-bold">Fundo (Cor / Opacidade)</label>
         <div className="flex gap-2">
            <input 
              type="color" 
              className="w-8 h-8 rounded cursor-pointer bg-transparent"
              value={config.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
            />
             <input 
              type="range"
              min="0" max="255"
              className="accent-brand-500 flex-1"
              value={config.backgroundOpacity}
              onChange={(e) => handleChange('backgroundOpacity', Number(e.target.value))}
            />
         </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { ScrapeRequest } from '../types';
import { Spinner } from './ui/Spinner';
import { Settings, Sparkles, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface ConverterFormProps {
  isLoading: boolean;
  onSubmit: (data: ScrapeRequest) => void;
}

export const ConverterForm: React.FC<ConverterFormProps> = ({ isLoading, onSubmit }) => {
  const [url, setUrl] = useState('');
  const [waitForSelector, setWaitForSelector] = useState('');
  const [includeImages, setIncludeImages] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    onSubmit({
      url,
      wait_for_selector: waitForSelector || undefined,
      include_images: includeImages,
    });
  };

  return (
    <div className="w-full">
      <div className="bg-dark-glass backdrop-blur-2xl rounded-[3rem] border border-white/10 p-2 shadow-2xl">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* URL Input */}
            <div className="space-y-3">
              <div className="relative group">
                <input
                  type="url"
                  id="url"
                  placeholder="https://example.com/article"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-8 py-6 text-xl font-mono text-white bg-black/40 border border-white/10 rounded-full focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none placeholder:text-white/20 shadow-inner"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <div className="bg-white/10 text-white/50 text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm tracking-wider">
                    GET
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="px-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-brand transition-colors mx-auto mb-2"
              >
                <Settings size={14} />
                <span>Config</span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced && (
                <div className="mt-4 p-6 bg-black/20 rounded-3xl border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label htmlFor="selector" className="block text-[10px] font-bold uppercase tracking-widest text-brand">
                      Wait for Selector
                    </label>
                    <input
                      type="text"
                      id="selector"
                      placeholder="#main-content"
                      value={waitForSelector}
                      onChange={(e) => setWaitForSelector(e.target.value)}
                      className="w-full px-6 py-3 text-sm font-mono bg-white/5 border border-white/10 rounded-full focus:ring-1 focus:ring-brand outline-none text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2">
                    <label className="text-sm font-medium text-white/80 flex items-center gap-3 cursor-pointer" onClick={() => setIncludeImages(!includeImages)}>
                      <ImageIcon size={18} className="text-brand" />
                      Include Images
                    </label>
                    <div 
                      onClick={() => setIncludeImages(!includeImages)}
                      className={`relative w-14 h-8 rounded-full cursor-pointer transition-all duration-300 ease-in-out border border-white/10 ${includeImages ? 'bg-brand' : 'bg-black/40'}`}
                    >
                      <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ease-in-out ${includeImages ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !url}
              className={`
                w-full py-6 rounded-full font-black text-lg tracking-widest uppercase
                flex items-center justify-center gap-4 transition-all transform hover:scale-[1.02] active:scale-[0.98]
                ${isLoading || !url 
                  ? 'bg-white/10 text-white/20 cursor-not-allowed' 
                  : 'bg-brand text-black hover:shadow-[0_0_40px_-10px_rgba(224,72,72,0.6)] shadow-lg'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Spinner className="text-brand" />
                  <span className="text-white">Processing</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Execute</span>
                </>
              )}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
};
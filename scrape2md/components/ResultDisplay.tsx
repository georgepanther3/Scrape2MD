import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ScrapeResponse } from '../types';
import { Copy, Check, ArrowLeft, FileText, Code, ExternalLink } from 'lucide-react';

interface ResultDisplayProps {
  data: ScrapeResponse;
  onReset: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'raw' | 'preview'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.markdown_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Calculate stats
  const original = data.metadata.original_length;
  const cleaned = data.metadata.cleaned_length;
  const reduction = original > 0 ? Math.round(((original - cleaned) / original) * 100) : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between px-2">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-mono text-sm uppercase tracking-wider"
        >
          <div className="bg-white/10 p-2 rounded-full"><ArrowLeft size={16} /></div>
          Back
        </button>
        <div className="flex items-center gap-2">
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-brand hover:text-white transition-colors flex items-center gap-2 bg-brand/10 px-4 py-2 rounded-full border border-brand/20">
                SOURCE LINK <ExternalLink size={12} />
            </a>
        </div>
      </div>

      {/* Title & Stats */}
      <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white truncate font-mono" title={data.title}>
            {data.title || "Untitled Page"}
          </h2>
          <p className="text-sm text-white/40 truncate mt-1 font-mono">{data.url}</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8 bg-black/30 p-4 rounded-3xl border border-white/5">
            <div className="text-right">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Tokens</p>
                <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-xl font-mono text-white">{cleaned.toLocaleString()}</span>
                </div>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Optimized</p>
                <p className="text-xl font-mono text-brand">-{reduction}%</p>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col h-[70vh] shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex p-1 bg-black/40 rounded-full border border-white/5">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'preview' 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <FileText size={14} />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'raw' 
                  ? 'bg-brand text-black shadow-lg' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Code size={14} />
              Code
            </button>
          </div>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              copied 
                ? 'bg-green-500 text-black' 
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-auto bg-transparent relative custom-scrollbar">
          {activeTab === 'preview' ? (
            <div className="max-w-none prose prose-invert prose-p:text-white/80 prose-headings:font-bold prose-headings:font-mono prose-a:text-brand hover:prose-a:text-white prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-img:rounded-2xl p-8 mx-auto">
              <ReactMarkdown>{data.markdown_content}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full w-full">
                <textarea 
                    readOnly
                    value={data.markdown_content}
                    className="w-full h-full p-8 font-mono text-sm leading-relaxed bg-black/20 text-white/70 outline-none resize-none"
                />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
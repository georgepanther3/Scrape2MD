import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ScrapeResponse } from '../types';
import { Copy, Check, ArrowLeft, FileText, Code, ExternalLink, List, Monitor, FileType, Download } from 'lucide-react';

interface ResultDisplayProps {
  data: ScrapeResponse | ScrapeResponse[];
  onReset: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, onReset }) => {
  // If data is array, we are in crawl mode
  const isCrawl = Array.isArray(data);
  const results = isCrawl ? data : [data];
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentData = results[selectedIndex];

  const [activeTab, setActiveTab] = useState<'raw' | 'preview' | 'screenshot' | 'pdf'>('preview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Reset tab when switching pages in crawl mode
    setActiveTab('preview');
  }, [selectedIndex]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentData.markdown_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownloadPdf = () => {
    if (!currentData.pdf_base64) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${currentData.pdf_base64}`;
    link.download = `scrape2md_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const original = currentData.metadata.original_length;
  const cleaned = currentData.metadata.cleaned_length;
  const reduction = original > 0 ? Math.round(((original - cleaned) / original) * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto flex gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 h-[80vh]">
      
      {/* Sidebar for Crawl Results */}
      {isCrawl && (
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
            <button 
                onClick={onReset}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-mono text-sm uppercase tracking-wider mb-2"
            >
                <div className="bg-white/10 p-2 rounded-full"><ArrowLeft size={16} /></div>
                Back
            </button>
            
            <div className="flex-1 bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 bg-black/20">
                    <h3 className="text-brand font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                        <List size={14} />
                        Pages ({results.length})
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {results.map((res, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedIndex(idx)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-xs font-mono truncate border ${
                                selectedIndex === idx 
                                ? 'bg-brand text-black border-brand font-bold shadow-lg' 
                                : 'text-white/60 hover:bg-white/10 border-transparent'
                            }`}
                        >
                            {res.title || res.url}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        
        {!isCrawl && (
            <div className="flex items-center justify-between px-2">
                <button 
                onClick={onReset}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-mono text-sm uppercase tracking-wider"
                >
                <div className="bg-white/10 p-2 rounded-full"><ArrowLeft size={16} /></div>
                Back
                </button>
            </div>
        )}

        <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
            <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white truncate font-mono" title={currentData.title}>
                    {currentData.title || "Untitled Page"}
                </h2>
                <a href={currentData.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-white transition-colors">
                    <ExternalLink size={16} />
                </a>
            </div>
            <p className="text-sm text-white/40 truncate font-mono">{currentData.url}</p>
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

        <div className="bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col flex-1 shadow-2xl min-h-0">
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
                {currentData.screenshot_base64 && (
                    <button
                    onClick={() => setActiveTab('screenshot')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === 'screenshot' 
                        ? 'bg-brand text-black shadow-lg' 
                        : 'text-white/40 hover:text-white'
                    }`}
                    >
                    <Monitor size={14} />
                    Screenshot
                    </button>
                )}
                {currentData.pdf_base64 && (
                    <button
                    onClick={() => setActiveTab('pdf')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        activeTab === 'pdf' 
                        ? 'bg-brand text-black shadow-lg' 
                        : 'text-white/40 hover:text-white'
                    }`}
                    >
                    <FileType size={14} />
                    PDF
                    </button>
                )}
            </div>

            {activeTab === 'pdf' ? (
                <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-brand text-black hover:shadow-[0_0_20px_-5px_rgba(224,72,72,0.6)] transition-all"
                >
                    <Download size={16} />
                    Download PDF
                </button>
            ) : (
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
            )}
            </div>

            <div className="flex-1 overflow-auto bg-transparent relative custom-scrollbar">
            {activeTab === 'preview' ? (
                <div className="max-w-none prose prose-invert prose-p:text-white/80 prose-headings:font-bold prose-headings:font-mono prose-a:text-brand hover:prose-a:text-white prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-img:rounded-2xl p-8 mx-auto">
                <ReactMarkdown>{currentData.markdown_content}</ReactMarkdown>
                </div>
            ) : activeTab === 'raw' ? (
                <div className="h-full w-full">
                    <textarea 
                        readOnly
                        value={currentData.markdown_content}
                        className="w-full h-full p-8 font-mono text-sm leading-relaxed bg-black/20 text-white/70 outline-none resize-none"
                    />
                </div>
            ) : activeTab === 'screenshot' ? (
                <div className="flex items-center justify-center p-8">
                    {currentData.screenshot_base64 ? (
                        <img 
                            src={`data:image/png;base64,${currentData.screenshot_base64}`} 
                            alt="Page Screenshot" 
                            className="max-w-full h-auto rounded-2xl border border-white/10 shadow-2xl"
                        />
                    ) : (
                        <p className="text-white/40">No screenshot available.</p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                    <FileType size={64} className="text-white/20" />
                    <p className="text-white/60 max-w-md">
                        PDF has been generated. Click the download button in the toolbar above to save it.
                    </p>
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};
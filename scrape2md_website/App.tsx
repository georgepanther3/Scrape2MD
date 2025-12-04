import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LivingBackground } from './components/LivingBackground';
import { CommandBar } from './components/CommandBar';
import { TerminalLog } from './components/TerminalLog';
import { ResultGrid } from './components/ResultGrid';
import { convertUrl, crawlUrl, mapUrl, searchUrl } from './services/api';
import { ScrapeRequest, ScrapeResponse, CrawlRequest, CrawlResponse, MapRequest, MapResponse, SearchRequest, SearchResponse } from './types';
import { Sparkles } from 'lucide-react';

type Mode = 'scrape' | 'crawl' | 'map' | 'search';
type AnyResponse = ScrapeResponse | CrawlResponse | MapResponse | SearchResponse;

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnyResponse | null>(null);
  const [mode, setMode] = useState<Mode>('scrape');
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async (request: ScrapeRequest | CrawlRequest | MapRequest | SearchRequest, selectedMode: Mode): Promise<void> => {
    setLoading(true);
    setResult(null);
    setError(null);
    setMode(selectedMode);

    try {
      const minLoadTime: Promise<void> = new Promise(resolve => setTimeout(resolve, 1500));
      let apiCall: Promise<AnyResponse>;

      if (selectedMode === 'scrape') {
        apiCall = convertUrl(request as ScrapeRequest);
      } else if (selectedMode === 'crawl') {
        apiCall = crawlUrl(request as CrawlRequest);
      } else if (selectedMode === 'map') {
        apiCall = mapUrl(request as MapRequest);
      } else if (selectedMode === 'search') {
        apiCall = searchUrl(request as SearchRequest);
      } else {
        throw new Error("Invalid mode");
      }
      
      const [data] = await Promise.all<[AnyResponse, void]>([apiCall, minLoadTime]);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (): React.ReactNode | null => {
    if (!result) return null;

    if (mode === 'scrape') {
      return <ResultGrid data={result as ScrapeResponse} />;
    }
    
    if (mode === 'map') {
      const mapData = result as MapResponse;
      return (
        <div className="w-full max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 font-mono flex items-center gap-3">
            <span className="text-indigo-400">MAP_OUTPUT</span>
            <span className="text-white/30 text-sm">{mapData.url}</span>
          </h2>
          <div className="grid gap-2 font-mono text-sm">
            {mapData.links.map((link: string, i: number) => (
              <div key={i} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5">
                <span className="text-white/20 text-xs">{String(i + 1).padStart(3, '0')}</span>
                <a href={link} target="_blank" rel="noopener noreferrer" className="truncate hover:underline decoration-indigo-500/50">
                  {link}
                </a>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (mode === 'search' || mode === 'crawl') {
      const multiData = result as (SearchResponse | CrawlResponse);
      
      if ('combined_markdown' in multiData) {
         return (
          <ResultGrid data={{
             url: multiData.query,
             title: `Search: ${multiData.query}`,
             markdown_content: multiData.combined_markdown,
             metadata: { original_length: multiData.combined_markdown.length, cleaned_length: multiData.combined_markdown.length }
          }} />
        );
      } else if ('results' in multiData && multiData.results.length > 0) {
         return (
          <ResultGrid data={multiData.results[0]} />
        );
      } else {
         return <div className="text-center text-white/50">No results found.</div>;
      }
    }

    return null;
  };

  return (
    <div className="relative min-h-screen w-full text-white overflow-x-hidden font-sans selection:bg-indigo-500/30">
      <LivingBackground />

      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col min-h-screen">
        
        <motion.header 
          className="flex justify-center mb-12"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
            <Sparkles size={18} className="text-indigo-400" />
            <span className="font-mono font-bold tracking-tight">SCRAPE2MD</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/50">v2.0</span>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="input-state"
              exit={{ opacity: 0, y: -50 }}
              className="flex-1 flex flex-col justify-center -mt-20"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12 space-y-4"
              >
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/20">
                  DATA REFINERY
                </h1>
                <p className="text-lg text-white/40 font-mono max-w-md mx-auto">
                  Transform raw chaos into structured clarity.
                </p>
              </motion.div>

              <CommandBar onSubmit={handleConvert} isLoading={loading} />

              {loading && <TerminalLog />}
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 max-w-md mx-auto font-mono text-sm"
                >
                  Error: {error}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="result-state"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1"
            >
               <div className="mb-8 flex justify-center">
                   <button 
                     onClick={() => setResult(null)}
                     className="text-xs font-mono text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                   >
                     ← Process New URL
                   </button>
               </div>
               {renderResult()}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default App;
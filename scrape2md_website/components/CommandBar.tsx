import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ArrowRight, Loader2, FileText, Network, Map as MapIcon, Search } from "lucide-react";
import { ScrapeRequest, CrawlRequest, MapRequest, SearchRequest } from "../types";

type Mode = 'scrape' | 'crawl' | 'map' | 'search';

interface CommandBarProps {
  onSubmit: (data: ScrapeRequest | CrawlRequest | MapRequest | SearchRequest, mode: Mode) => void;
  isLoading: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = ({ onSubmit, isLoading }) => {
  const [mode, setMode] = useState<Mode>('scrape');
  const [url, setUrl] = useState<string>("");
  const [showConfig, setShowConfig] = useState<boolean>(false);
  
  const [scrapeConfig, setScrapeConfig] = useState({
    wait_for_selector: "",
    target_selector: "",
    remove_selector: "",
    include_images: false,
    summarize: false,
  });
  
  const [crawlConfig, setCrawlConfig] = useState({
    max_depth: 2,
    max_pages: 10,
  });

  const [searchConfig, setSearchConfig] = useState({
    limit: 3,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    if (mode === 'scrape') {
      onSubmit({ 
        url, 
        ...scrapeConfig,
        wait_for_selector: scrapeConfig.wait_for_selector || undefined,
        target_selector: scrapeConfig.target_selector || undefined,
        remove_selector: scrapeConfig.remove_selector || undefined,
        summarize: scrapeConfig.summarize,
      }, 'scrape');
    } else if (mode === 'crawl') {
      onSubmit({
        url,
        ...crawlConfig,
        wait_for_selector: scrapeConfig.wait_for_selector || undefined,
      }, 'crawl');
    } else if (mode === 'map') {
      onSubmit({ url }, 'map');
    } else if (mode === 'search') {
      onSubmit({
        query: url, 
        limit: searchConfig.limit,
      }, 'search');
    }
  };

  const getPlaceholder = (): string => {
    switch(mode) {
      case 'search': return "Search query (e.g. 'python tutorials')";
      case 'crawl': return "Start URL (e.g. https://docs.python.org)";
      case 'map': return "Site URL to Map (e.g. https://example.com)";
      default: return "https://example.com/article";
    }
  };

  return (
    <motion.div 
      layoutId="command-center"
      className="w-full max-w-3xl mx-auto relative z-50 flex flex-col gap-4"
    >
      <div className="flex justify-center gap-2 mb-2">
        {[
          { id: 'scrape', icon: FileText, label: 'Scrape' },
          { id: 'crawl', icon: Network, label: 'Crawl' },
          { id: 'map', icon: MapIcon, label: 'Map' },
          { id: 'search', icon: Search, label: 'Search' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as Mode)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
              mode === m.id 
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_-5px_rgba(99,102,241,0.5)]' 
                : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <m.icon size={14} />
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full p-2 transition-all duration-500 group-focus-within:border-indigo-500/50 group-focus-within:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] group-focus-within:bg-black/40">
          
          <div className="pl-6 pr-4 text-white/30">
            <Settings 
              size={20} 
              className={`cursor-pointer hover:text-indigo-400 transition-colors ${showConfig ? 'text-indigo-400' : ''}`}
              onClick={() => setShowConfig(!showConfig)}
            />
          </div>

          <input
            type={mode === 'search' ? "text" : "url"}
            placeholder={getPlaceholder()}
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-lg placeholder:text-white/20 h-14 w-full min-w-0"
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            required
          />

          <button
            disabled={isLoading || !url}
            type="submit"
            className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ rotate: 0, opacity: 0 }}
                  animate={{ rotate: 360, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Loader2 size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 10, opacity: 0 }}
                >
                  <ArrowRight size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 10, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="absolute top-full left-0 right-0 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl mt-2"
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {(mode === 'scrape' || mode === 'crawl') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Wait Selector</label>
                      <input 
                        type="text" 
                        placeholder="#content"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                        value={scrapeConfig.wait_for_selector}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScrapeConfig({...scrapeConfig, wait_for_selector: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {mode === 'scrape' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Target Selector</label>
                      <input 
                        type="text" 
                        placeholder="article.main"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                        value={scrapeConfig.target_selector}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScrapeConfig({...scrapeConfig, target_selector: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Exclude Selector</label>
                      <input 
                        type="text" 
                        placeholder=".ads, .nav"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                        value={scrapeConfig.remove_selector}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScrapeConfig({...scrapeConfig, remove_selector: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 border border-white/10 h-[42px] mt-auto">
                      <span className="text-sm text-white/70">Include Images</span>
                      <button 
                        type="button"
                        onClick={() => setScrapeConfig({...scrapeConfig, include_images: !scrapeConfig.include_images})}
                        className={`w-10 h-5 rounded-full transition-colors relative ${scrapeConfig.include_images ? 'bg-indigo-500' : 'bg-white/20'}`}
                      >
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${scrapeConfig.include_images ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 border border-white/10 h-[42px] mt-2">
                      <span className="text-sm text-white/70">Generate Summary</span>
                      <button 
                        type="button"
                        onClick={() => setScrapeConfig({...scrapeConfig, summarize: !scrapeConfig.summarize})}
                        className={`w-10 h-5 rounded-full transition-colors relative ${scrapeConfig.summarize ? 'bg-emerald-500' : 'bg-white/20'}`}
                      >
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${scrapeConfig.summarize ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </>
                )}

                {mode === 'crawl' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Max Depth</label>
                      <input 
                        type="number" 
                        min="1" max="5"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                        value={crawlConfig.max_depth}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrawlConfig({...crawlConfig, max_depth: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Max Pages</label>
                      <input 
                        type="number" 
                        min="1" max="50"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                        value={crawlConfig.max_pages}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrawlConfig({...crawlConfig, max_pages: parseInt(e.target.value)})}
                      />
                    </div>
                  </>
                )}

                {mode === 'search' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Max Results</label>
                      <input 
                        type="number" 
                        min="1" max="10"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                        value={searchConfig.limit}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchConfig({...searchConfig, limit: parseInt(e.target.value)})}
                      />
                    </div>
                  </>
                )}
                
                 {mode === 'map' && (
                  <div className="col-span-2 text-center text-white/40 italic py-2">
                    No additional configuration for Site Mapping.
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
};
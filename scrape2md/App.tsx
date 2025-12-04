import React, { useState } from 'react';
import { ConverterForm } from './components/ConverterForm';
import { ResultDisplay } from './components/ResultDisplay';
import { convertUrl } from './services/api';
import { ScrapeRequest, ScrapeResponse } from './types';
import { FileCode, Github, AlertCircle } from 'lucide-react';

// Use a namespace import to avoid "does not provide an export named" errors
// if the CDN provides a CommonJS module wrapped in a default export.
import * as ShadersModule from '@paper-design/shaders-react';

// Safely extract the component, checking both named export and default export property
// @ts-ignore
const Dithering = ShadersModule.Dithering || ShadersModule.default?.Dithering;

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async (request: ScrapeRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await convertUrl(request);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to convert URL. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        {Dithering && (
          <Dithering
            width={window.innerWidth}
            height={window.innerHeight}
            colorBack="#ff000033"
            colorFront="#e04848"
            shape="swirl"
            type="8x8"
            size={1.6}
            speed={1}
          />
        )}
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 backdrop-blur-md bg-black/30 px-4 py-2 rounded-full border border-white/10">
            <div className="text-brand">
              <FileCode size={20} />
            </div>
            <span className="text-lg font-mono font-bold tracking-tight text-white">
              SCRAPE2MD
            </span>
          </div>
          <div className="flex items-center gap-4">
             <a href="#" className="text-white/60 hover:text-brand transition-colors p-2 bg-black/30 rounded-full backdrop-blur-md border border-white/5">
                <Github size={20} />
             </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
        
        {!result ? (
          /* Hero & Form State */
          <div className="w-full max-w-3xl space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center space-y-2">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 mb-4 drop-shadow-2xl">
                WEB <span className="text-brand">2</span> MARKDOWN
              </h1>
              <p className="text-lg md:text-xl text-white/60 max-w-xl mx-auto font-mono">
                 ingest_url &gt; process &gt; output.md
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 backdrop-blur-xl border border-red-500/30 p-4 rounded-3xl flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-red-400 font-bold text-sm tracking-wide uppercase">System Error</h3>
                  <p className="text-red-200/80 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            <ConverterForm isLoading={loading} onSubmit={handleConvert} />
          </div>
        ) : (
          /* Result State */
          <ResultDisplay data={result} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-white/20 text-xs font-mono uppercase tracking-widest">
            System Online • FastAPI • Playwright
        </p>
      </footer>
    </div>
  );
};

export default App;
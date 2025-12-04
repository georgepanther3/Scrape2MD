import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, FileText, Code, Globe, Zap } from "lucide-react";
import { ScrapeResponse } from "../types";

interface ResultGridProps {
  data: ScrapeResponse;
}

export const ResultGrid: React.FC<ResultGridProps> = ({ data }: ResultGridProps) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(data.markdown_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", bounce: 0.3 }}
      className="w-full max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 h-[80vh]"
    >
      <motion.div 
        className="md:col-span-4 flex flex-col gap-6"
      >
        {data.summary && (
          <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 hover:border-emerald-500/40 transition-colors">
             <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <Zap size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">TL;DR Summary</span>
            </div>
            <p className="text-sm text-emerald-100/80 leading-relaxed font-medium">
              {data.summary}
            </p>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-colors flex-1">
            <div>
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Zap size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Efficiency</span>
                </div>
                <div className="text-4xl font-mono font-bold text-white">
                    {data.metadata.original_length > 0 
                        ? Math.round((1 - (data.metadata.cleaned_length / data.metadata.original_length)) * 100) 
                        : 0}%
                </div>
                <div className="text-white/40 text-sm mt-1">Optimization Rate</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-black/20 p-4 rounded-2xl">
                    <div className="text-xs text-white/40 uppercase">Original</div>
                    <div className="text-lg font-mono text-white/80">{data.metadata.original_length}</div>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-emerald-500/20">
                    <div className="text-xs text-emerald-400/60 uppercase">Cleaned</div>
                    <div className="text-lg font-mono text-emerald-400">{data.metadata.cleaned_length}</div>
                </div>
            </div>
        </div>
      </motion.div>

      <motion.div 
        className="md:col-span-8 md:row-span-2 bg-[#1e1e1e] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        whileHover={{ scale: 1.005 }}
      >
        <div className="h-12 bg-[#252526] border-b border-white/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
                <div className="ml-4 flex bg-black/20 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('preview')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'preview' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        Preview
                    </button>
                    <button 
                        onClick={() => setActiveTab('raw')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'raw' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        Markdown
                    </button>
                </div>
            </div>
            
            <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors"
            >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? <span className="text-emerald-400">Copied</span> : "Copy"}
            </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
            {activeTab === 'preview' ? (
                <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-400 prose-img:rounded-xl">
                    <ReactMarkdown>{data.markdown_content}</ReactMarkdown>
                </div>
            ) : (
                <SyntaxHighlighter 
                    language="markdown" 
                    style={vscDarkPlus}
                    customStyle={{ background: 'transparent', padding: 0 }}
                    showLineNumbers={true}
                    lineNumberStyle={{ minWidth: "2em", paddingRight: "1em", color: "#505050" }}
                >
                    {data.markdown_content}
                </SyntaxHighlighter>
            )}
        </div>
      </motion.div>

      <motion.div 
        className="md:col-span-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-center gap-2 hover:border-cyan-500/30 transition-colors"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Globe size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Source</span>
        </div>
        <h3 className="text-xl font-bold text-white leading-tight line-clamp-2" title={data.title}>
            {data.title || "Untitled Document"}
        </h3>
        <p className="text-xs font-mono text-white/40 truncate mt-2 p-2 bg-black/20 rounded-lg border border-white/5">
            {data.url}
        </p>
      </motion.div>

    </motion.div>
  );
};
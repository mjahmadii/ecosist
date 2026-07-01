import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  // Stripping outer markdown wrapping code blocks if the AI outputs everything inside a codeblock
  let cleanedContent = content.trim();
  
  // Clean leading and trailing markdown code block wrappers
  const markdownCodeBlockRegex = /^```(?:markdown|md|text|txt)?\n([\s\S]*?)\n```$/i;
  const match = cleanedContent.match(markdownCodeBlockRegex);
  if (match) {
    cleanedContent = match[1].trim();
  } else {
    // Fallback simple clean if there are outer markdown markers
    if (cleanedContent.startsWith('```markdown')) {
      cleanedContent = cleanedContent.substring(11).trim();
    } else if (cleanedContent.startsWith('```md')) {
      cleanedContent = cleanedContent.substring(5).trim();
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.substring(3).trim();
    }
    
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.substring(0, cleanedContent.length - 3).trim();
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="relative group/md-render w-full" dir="rtl">
      {/* Elegantly Positioned Copy Button */}
      <div className="absolute top-1 left-1 opacity-0 group-hover/md-render:opacity-100 transition-opacity z-20">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 bg-[#16161a] hover:bg-neutral-800 text-neutral-400 hover:text-white text-[10px] rounded border border-white/10 transition-all shadow-lg cursor-pointer font-sans"
          title="کپی متن خام مارک‌داون"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? 'کپی شد!' : 'کپی مارک‌داون'}</span>
        </button>
      </div>

      <div className="markdown-body text-right space-y-1.5 leading-relaxed font-sans prose prose-invert max-w-none text-xs">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Headers
            h1: ({ children }) => (
              <h1 className="text-sm md:text-base font-black text-white mt-4 mb-2 pb-1 border-b border-blue-500/30 font-sans">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xs md:text-sm font-bold text-indigo-400 mt-4 mb-2 pb-1 border-b border-white/5 font-sans">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xs font-bold text-blue-400 mt-3 mb-1.5 font-sans">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-[11px] font-semibold text-neutral-200 mt-3 mb-1 font-sans">
                {children}
              </h4>
            ),
            // Paragraph
            p: ({ children }) => (
              <p className="text-neutral-300 text-xs leading-relaxed mb-2 font-sans text-right" dir="rtl">
                {children}
              </p>
            ),
            // Lists
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-neutral-300 pr-2 py-0.5 space-y-1 text-xs font-sans text-right" dir="rtl">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-neutral-300 pr-2 py-0.5 space-y-1 text-xs font-sans text-right" dir="rtl">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-neutral-300 py-0.5 font-sans text-right" dir="rtl">
                {children}
              </li>
            ),
            // Bold
            strong: ({ children }) => (
              <strong className="font-extrabold text-white">
                {children}
              </strong>
            ),
            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-r-2 border-blue-500 bg-blue-500/5 pr-3 py-1 my-2 text-xs italic text-neutral-400 font-sans rounded-l text-right" dir="rtl">
                {children}
              </blockquote>
            ),
            // Tables with GFM support
            table: ({ children }) => (
              <div className="overflow-x-auto my-3 border border-white/10 rounded-xl bg-[#0a0a0b]/40 shadow-inner w-full">
                <table className="w-full text-right border-collapse text-[11px] font-sans">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-blue-500/10 border-b border-white/10 text-blue-400 font-bold">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-white/5">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-white/5 transition-colors odd:bg-white/[0.01]">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="px-3.5 py-2.5 font-bold border-l border-white/5 last:border-l-0 text-right">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3.5 py-2.5 text-neutral-200 border-l border-white/5 last:border-l-0 text-right font-sans">
                {children}
              </td>
            ),
            // Code
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !match ? (
                <code className="bg-neutral-800 text-neutral-200 px-1 py-0.5 rounded text-[11px] font-mono" {...props}>
                  {children}
                </code>
              ) : (
                <pre className="bg-[#0a0a0b]/80 border border-white/5 rounded-lg p-3 my-2 overflow-x-auto custom-scrollbar text-[11px] font-mono leading-relaxed text-neutral-300 text-left" dir="ltr">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }
          }}
        >
          {cleanedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split content by paragraphs/newlines
  const lines = content.split('\n');

  return (
    <div className="space-y-3 font-sans opacity-95 text-slate-700">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // Check headers
        if (trimmed.startsWith('###')) {
          const headerText = trimmed.replace(/^###\s*/, '');
          return (
            <h4 key={idx} className="text-sm font-black text-slate-800 mt-5 mb-2 flex items-center gap-1">
              {parseBoldText(headerText)}
            </h4>
          );
        }
        if (trimmed.startsWith('##')) {
          const headerText = trimmed.replace(/^##\s*/, '');
          return (
            <h3 key={idx} className="text-base font-black text-emerald-800 mt-6 mb-3 border-b border-emerald-100 pb-1 flex items-center gap-1 bg-emerald-50/15 p-1 rounded-sm">
              {parseBoldText(headerText)}
            </h3>
          );
        }
        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#\s*/, '');
          return (
            <h2 key={idx} className="text-lg font-black text-slate-900 mt-6 mb-4 pb-1 border-b border-slate-100">
              {parseBoldText(headerText)}
            </h2>
          );
        }

        // Check list items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listText = trimmed.replace(/^[-*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-3 mt-1.5 leading-relaxed">
              <span className="text-emerald-500 font-extrabold select-none">•</span>
              <span className="text-xs text-slate-650 flex-1 font-medium">
                {parseBoldText(listText)}
              </span>
            </div>
          );
        }

        // Normal paragraph text
        return (
          <p key={idx} className="text-xs text-slate-650 leading-relaxed font-medium">
            {parseBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// Helper function to render **bold** patterns nicely inside react elements
function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const cleanPart = part.slice(2, -2);
      return <strong key={i} className="font-extrabold text-slate-900">{cleanPart}</strong>;
    }
    return part;
  });
}

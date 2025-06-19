import { Doc } from "../../convex/_generated/dataModel";
import { useState } from "react";



interface PoemCardProps {
  poem: Doc<"poems">;
  isDark: boolean;
}

export function PoemCard({ poem, isDark }: PoemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPreview = (content: string, maxLines: number = 3) => {
    const lines = content.split('\n');
    if (lines.length <= maxLines) return content;
    return lines.slice(0, maxLines).join('\n') + '...';
  };

  return (
    <div className={`group relative overflow-hidden rounded-2xl transition-all duration-500 ${
      isExpanded ? 'col-span-full' : ''
    } hover:shadow-2xl ${
      isExpanded ? 'shadow-2xl scale-[1.02]' : 'hover:scale-105'
    }`} style={{
      backgroundImage: `url("/poem-bg.png")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      border: isDark ? '1px solid rgba(55, 65, 81, 0.5)' : '1px solid rgba(229, 231, 235, 0.5)'
    }}>
      {/* Background Overlay */}
      <div className={`absolute inset-0 ${
        isDark ? 'bg-black/40' : 'bg-white/60'
      }`} />
      
      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="mb-4">
          {/* Title */}
          <h3 className={`text-xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {poem.title}
          </h3>
          
          {/* Date and Username */}
          <div className="flex items-center space-x-2 text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              {formatDate(poem._creationTime)}
            </span>
            {poem.username && (
              <>
                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>•</span>
                <span className={`font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                  @{poem.username}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Content Preview/Full */}
        <div className={`text-sm leading-relaxed mb-4 ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        } transition-all duration-500`}>
          {(isExpanded ? poem.content : getPreview(poem.content)).split('\n').map((line, index) => (
            <p key={index} className="mb-1">
              {line || '\u00A0'}
            </p>
          ))}
        </div>
        
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
            isDark
              ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-600/30'
              : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/20'
          } hover:scale-105`}
        >
          {isExpanded ? '↑ Show Less' : '↓ Read Full Poem'}
        </button>
      </div>
      
      {/* Decorative Elements */}
      <div className={`absolute top-0 right-0 w-20 h-20 ${
        isDark ? 'bg-purple-600/10' : 'bg-purple-500/10'
      } rounded-bl-full transition-all duration-300 ${
        isExpanded ? 'scale-150 opacity-50' : ''
      }`} />
      
      {/* Floral accent for expanded state */}
      {isExpanded && (
        <div className="absolute bottom-4 right-4 text-2xl opacity-30 animate-pulse">
          🌸
        </div>
      )}
    </div>
  );
}

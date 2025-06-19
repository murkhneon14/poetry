interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-full transition-colors ${
        isDark 
          ? 'hover:bg-gray-800 text-gray-300' 
          : 'hover:bg-gray-100 text-gray-600'
      }`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

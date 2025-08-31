import { Command, Hash } from 'lucide-react';
import { CommandSuggestion } from '@/hooks/useCommandAutocomplete';
import { cn } from '@/lib/utils';

interface CommandSuggestionsProps {
  suggestions: CommandSuggestion[];
  selectedIndex: number;
  onSelect: (suggestion: CommandSuggestion) => void;
}

export const CommandSuggestions = ({
  suggestions,
  selectedIndex,
  onSelect
}: CommandSuggestionsProps) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Command className="h-4 w-4" />
          <span>Slash Commands</span>
        </div>
      </div>
      
      <div className="py-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.type}-${suggestion.name}`}
            className={cn(
              "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3",
              index === selectedIndex && "bg-accent text-accent-foreground"
            )}
            onClick={() => onSelect(suggestion)}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {suggestion.type === 'command' ? (
                <Command className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {suggestion.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {suggestion.description}
                </div>
              </div>
            </div>
            
            {index === selectedIndex && (
              <div className="text-xs text-muted-foreground flex-shrink-0">
                Enter
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
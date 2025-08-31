import { useState, useMemo } from 'react';
import { commands } from '@/features/command/command-registry';

export interface CommandSuggestion {
  name: string;
  description: string;
  type: 'command' | 'option';
}

export const useCommandAutocomplete = (input: string) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const suggestions = useMemo(() => {
    if (!input.startsWith('/')) return [];
    
    const inputWithoutSlash = input.slice(1);
    const parts = inputWithoutSlash.split(' ');
    const commandName = parts[0].toLowerCase();
    
    // If we're still typing the command name
    if (parts.length === 1) {
      return Object.values(commands)
        .filter(cmd => cmd.name.startsWith(commandName))
        .map(cmd => ({
          name: `/${cmd.name}`,
          description: cmd.description,
          type: 'command' as const
        }));
    }
    
    // If we're typing arguments for a specific command
    const command = commands[commandName];
    if (command && command.options) {
      const currentArgIndex = parts.length - 2;
      const option = command.options[currentArgIndex];
      
      if (option) {
        return [{
          name: option.name,
          description: `${option.description} (${option.type})${option.required ? ' *' : ''}`,
          type: 'option' as const
        }];
      }
    }
    
    return [];
  }, [input]);

  const resetSelection = () => setSelectedIndex(0);
  
  const navigateUp = () => {
    setSelectedIndex(prev => Math.max(0, prev - 1));
  };
  
  const navigateDown = () => {
    setSelectedIndex(prev => Math.min(suggestions.length - 1, prev + 1));
  };
  
  const getSelectedSuggestion = () => suggestions[selectedIndex];

  return {
    suggestions,
    selectedIndex,
    resetSelection,
    navigateUp,
    navigateDown,
    getSelectedSuggestion,
    hasSuggestions: suggestions.length > 0
  };
};
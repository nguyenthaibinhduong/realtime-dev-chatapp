import { useState, useCallback } from "react";
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_KEY;
const ai = new GoogleGenAI({ apiKey });

interface UseGeminiOptions {
  model?: string;
  onSuccess?: (text: string) => void;
  onError?: (error: Error) => void;
}

interface UseGeminiReturn {
  generateContent: (prompt: string) => Promise<void>;
  response: string | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useGemini(options: UseGeminiOptions = {}): UseGeminiReturn {
  const { model = "gemini-2.5-flash", onSuccess, onError } = options;

  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateContent = useCallback(
    async (prompt: string) => {
      setLoading(true);
      setError(null);
      setResponse(null);

      try {
        const result = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const text = result.text;
        setResponse(text);
        onSuccess?.(text);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [model, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    generateContent,
    response,
    loading,
    error,
    reset,
  };
}

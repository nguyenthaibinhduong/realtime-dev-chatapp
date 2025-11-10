import { GithubAPI } from "@/api/api";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface CommitAnalysisProps {
  owner: string;
  repo: string;
  sha: string;
  prompt?: string;
}

export default function CommitAnalysisComponent(props: CommitAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommitAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GithubAPI.getCommitAnalysis({
        owner: props.owner,
        repo: props.repo,
        sha: props.sha,
        prompt: props.prompt || "Phân tích các thay đổi trong commit này",
      });

      setAnalysis(response.data);
    } catch (error) {
      console.error("Failed to fetch commit analysis:", error);
      setError("Không thể phân tích commit. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Analyze Button */}
      {!analysis && (
        <Button
          onClick={fetchCommitAnalysis}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Phân tích commit với AI
            </>
          )}
        </Button>
      )}

      {/* Error State */}
      {error && (
        <Alert
          variant="destructive"
          className="bg-red-900/20 border-red-900 text-red-400"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
          <div className="h-4 bg-zinc-700 rounded w-full"></div>
          <div className="h-4 bg-zinc-700 rounded w-5/6"></div>
          <div className="h-4 bg-zinc-700 rounded w-2/3"></div>
        </div>
      )}

      {/* Analysis Result */}
      {analysis && !loading && (
        <div className="space-y-4">
          {/* Header with re-analyze button */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
            <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Kết quả phân tích
            </h4>
            <Button
              onClick={fetchCommitAnalysis}
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-zinc-400 hover:text-white"
            >
              Phân tích lại
            </Button>
          </div>

          {/* Markdown Content */}
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-2xl font-bold mb-3 mt-4 text-zinc-100"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-xl font-bold mb-2 mt-4 text-zinc-200"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-lg font-bold mb-2 mt-3 text-zinc-300"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p className="mb-3 leading-7 text-zinc-300" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="list-disc list-inside mb-3 space-y-1 text-zinc-300"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="list-decimal list-inside mb-3 space-y-1 text-zinc-300"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li className="ml-4 text-zinc-300" {...props} />
                ),
                code: ({
                  node,
                  inline,
                  className,
                  children,
                  ...props
                }: any) => {
                  return inline ? (
                    <code
                      className="bg-zinc-800 text-purple-400 px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className={`${className} block bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto border border-zinc-800`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ node, ...props }) => (
                  <pre
                    className="bg-zinc-950 rounded-lg overflow-hidden mb-3 border border-zinc-800"
                    {...props}
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-purple-500 pl-4 italic my-3 text-zinc-400"
                    {...props}
                  />
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto mb-3">
                    <table
                      className="min-w-full border border-zinc-700"
                      {...props}
                    />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th
                    className="border border-zinc-700 px-4 py-2 bg-zinc-800 font-semibold text-zinc-200"
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    className="border border-zinc-700 px-4 py-2 text-zinc-300"
                    {...props}
                  />
                ),
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

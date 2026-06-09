import { GithubAPI } from "@/api/api";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  FileCode2,
  Brain,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BASE_INSTRUCTIONS_VN } from "./promts/commitAnalysisPrompt";
import { blockUi } from "@/components/blocks/block-ui";

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
  const [isOpen, setIsOpen] = useState(false);

  const fetchCommitAnalysis = async () => {
    setLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      const response = await GithubAPI.getCommitAnalysis({
        owner: props.owner,
        repo: props.repo,
        sha: props.sha,
        prompt: props.prompt || BASE_INSTRUCTIONS_VN,
      });

      setAnalysis(response.data);
    } catch (error) {
      console.error("Failed to fetch commit analysis:", error);
      setError("Không thể phân tích commit. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Clear state when closing
    setTimeout(() => {
      setAnalysis(null);
      setError(null);
    }, 300);
  };

  return (
    <>
      {/* Compact Analyze Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={fetchCommitAnalysis}
        disabled={loading}
        className="h-8 border-emerald-300 text-black bg-gradient-to-r from-emerald-50 to-blue-50 hover:from-emerald-100 hover:to-blue-100 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-105"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Brain className="h-4 w-4 mr-2 text-emerald-600" />
        )}
        {loading ? "Phân tích..." : "Phân tích AI"}
      </Button>

      {/* Analysis Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`w-[calc(100vw-1.5rem)] max-w-4xl h-[85vh] p-0 overflow-hidden rounded-xl ${blockUi.dialog}`}>
          <DialogHeader className={`px-6 py-4 ${blockUi.dialogHeader}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      Phân tích Commit AI
                    </span>
                    <Zap className="h-5 w-5 text-amber-400 animate-pulse" />
                  </DialogTitle>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono text-emerald-500 dark:text-emerald-400">
                      {props.sha.slice(0, 7)}
                    </span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="text-foreground/80">
                      {props.owner}/{props.repo}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {analysis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCommitAnalysis}
                    disabled={loading}
                    className={blockUi.subtleButton}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                    />
                    Phân tích lại
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {/* Loading State */}
            {loading && !analysis && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Brain className="h-10 w-10 text-white animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Đang phân tích commit...
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    AI đang xem xét các thay đổi trong commit và chuẩn bị phân
                    tích chi tiết
                  </p>
                </div>
                <div className="space-y-3 animate-pulse w-full max-w-md">
                  <div className="h-3 bg-muted rounded-full"></div>
                  <div className="h-3 bg-muted rounded-full w-4/5"></div>
                  <div className="h-3 bg-muted rounded-full w-3/5"></div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
                <div className="h-20 w-20 rounded-full bg-red-900/20 border-2 border-red-600 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-red-400">
                    Lỗi phân tích
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">{error}</p>
                </div>
                <Button
                  onClick={fetchCommitAnalysis}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Thử lại
                </Button>
              </div>
            )}

            {/* Success State */}
            {analysis && !loading && (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <FileCode2 className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Kết quả phân tích
                    </h3>
                  </div>
                  <div className="h-px bg-gradient-to-r from-purple-600 via-blue-600 to-transparent"></div>
                </div>

                {/* Markdown Content with enhanced styling */}
                <div className="prose prose-invert prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-3xl font-bold mb-4 mt-6 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-2xl font-bold mb-3 mt-5 text-foreground border-b border-border pb-2"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-xl font-semibold mb-3 mt-4 text-foreground flex items-center gap-2"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="mb-4 leading-8 text-foreground/85 text-base"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="list-none mb-4 space-y-2 text-foreground/85"
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          className="list-decimal list-inside mb-4 space-y-2 text-foreground/85"
                          {...props}
                        />
                      ),
                      li: ({ node, children, ...props }) => (
                        <li
                          className="ml-0 text-foreground/85 flex items-start gap-3 p-2 rounded-lg bg-muted/30 transition-colors"
                          {...props}
                        >
                          <span className="inline-flex items-center justify-center w-1.5 h-1.5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mt-3 flex-shrink-0"></span>
                          <span className="flex-1">{children}</span>
                        </li>
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
                            className="bg-muted text-purple-600 dark:text-purple-300 px-2 py-1 rounded-md text-sm font-mono border border-border"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className={`${className} block bg-muted text-foreground p-6 rounded-xl overflow-x-auto border border-border shadow-sm`}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      pre: ({ node, ...props }) => (
                        <pre
                          className="bg-muted rounded-xl overflow-hidden mb-4 border border-border shadow-sm"
                          {...props}
                        />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-l-primary bg-muted/40 pl-6 py-4 my-4 text-muted-foreground italic rounded-r-lg"
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto mb-4 rounded-lg border border-border">
                          <table className="min-w-full" {...props} />
                        </div>
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          className="border border-border px-6 py-3 bg-muted font-semibold text-foreground text-left"
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td
                          className="border border-border px-6 py-3 text-foreground/85"
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
        </DialogContent>
      </Dialog>
    </>
  );
}

import { OpenaiMessage } from "@workspace/api-client-react";
import { User, Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: OpenaiMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>

      <div
        className={`flex flex-col gap-1 max-w-[85%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span className="font-medium">
            {isUser ? "Siz" : "O'zbek AI"}
          </span>
        </div>
        
        <div
          className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
            isUser
              ? "bg-secondary text-secondary-foreground rounded-tr-sm"
              : "bg-card border border-border text-card-foreground rounded-tl-sm prose prose-sm prose-primary dark:prose-invert max-w-none"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <div className="break-words">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary animate-pulse" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

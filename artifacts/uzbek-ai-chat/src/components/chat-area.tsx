import { SendHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OpenaiMessage } from "@workspace/api-client-react";
import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { MessageBubble } from "./message-bubble";

interface ChatAreaProps {
  messages: OpenaiMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export function ChatArea({
  messages,
  streamingMessage,
  isStreaming,
  onSendMessage,
  isLoading,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, streamingMessage]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
        ref={scrollRef}
      >
        <div className="max-w-3xl mx-auto space-y-6 pb-24">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 && !streamingMessage ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-serif text-primary">O'z</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Xush kelibsiz!
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Men sizning shaxsiy sun'iy intellekt yordamchiningizman. Qanday yordam bera olaman?
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              
              {isStreaming && streamingMessage && (
                <MessageBubble 
                  message={{
                    id: 0,
                    content: streamingMessage,
                    role: "assistant",
                    conversationId: 0,
                    createdAt: new Date().toISOString()
                  }} 
                  isStreaming={true} 
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-3xl mx-auto relative flex items-end shadow-lg shadow-primary/5 rounded-2xl bg-card border border-border overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Xabar yozing..."
            className="min-h-[56px] max-h-[200px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 px-4 py-4 text-base"
            rows={1}
            data-testid="input-message"
          />
          <div className="p-2">
            <Button
              size="icon"
              className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              data-testid="button-send-message"
            >
              <SendHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          O'zbek AI xato qilishi mumkin. Muhim ma'lumotlarni tekshirib ko'ring.
        </p>
      </div>
    </div>
  );
}

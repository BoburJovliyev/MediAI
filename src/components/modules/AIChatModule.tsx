import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Trash2, Sparkles, Stethoscope, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { text: "Bosh og'riqqa nima yordam beradi?", emoji: "🤕" },
  { text: "Yurak kasalliklarining belgilari nima?", emoji: "❤️" },
  { text: "Diabet bilan qanday ovqatlanish kerak?", emoji: "🍎" },
  { text: "Bosim ko'tarilganda nima qilish kerak?", emoji: "💊" },
  { text: "Immunitetni qanday mustahkamlash mumkin?", emoji: "🛡️" },
  { text: "Stress va bezovtalikni qanday kamaytirish mumkin?", emoji: "🧘" },
];

// Simple markdown renderer for AI responses
const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Heading ##
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-foreground mt-3 mb-1.5 flex items-center gap-1.5">
          {processInline(trimmed.slice(3))}
        </h3>
      );
    }
    // Bullet list
    else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-sm leading-relaxed ml-1 my-0.5">
          <span className="text-primary mt-0.5 shrink-0">•</span>
          <span>{processInline(trimmed.slice(2))}</span>
        </div>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\.\s/)?.[1];
      const rest = trimmed.replace(/^\d+\.\s/, "");
      elements.push(
        <div key={i} className="flex items-start gap-2 text-sm leading-relaxed ml-1 my-0.5">
          <span className="text-primary font-semibold mt-0.5 shrink-0 min-w-[18px]">{num}.</span>
          <span>{processInline(rest)}</span>
        </div>
      );
    }
    // Empty line
    else if (trimmed === "") {
      elements.push(<div key={i} className="h-1.5" />);
    }
    // Normal paragraph
    else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed my-0.5">
          {processInline(trimmed)}
        </p>
      );
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
};

// Process inline markdown: **bold** and *italic*
const processInline = (text: string): (string | JSX.Element)[] => {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic *text*
    const italicMatch = remaining.match(/\*([^*]+?)\*/);

    const firstMatch = [boldMatch, italicMatch]
      .filter(Boolean)
      .sort((a, b) => (a!.index || 0) - (b!.index || 0))[0];

    if (!firstMatch || firstMatch.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }

    if (firstMatch === boldMatch) {
      parts.push(
        <strong key={`b${keyIdx++}`} className="font-semibold text-foreground">
          {firstMatch[1]}
        </strong>
      );
    } else {
      parts.push(
        <em key={`i${keyIdx++}`} className="italic text-muted-foreground">
          {firstMatch[1]}
        </em>
      );
    }

    remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
  }

  return parts;
};

const AIChatModule = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Assalomu alaykum! 👋🩺\n\nMen **Medi AI** — sizning shaxsiy tibbiy yordamchingizman.\n\nSog'liq bo'yicha har qanday savolingizga ilmiy dalillarga asoslangan javob berishga tayyorman. 💡\n\n**Qanday yordam bera olaman?**\n- 🤒 Kasallik belgilari haqida\n- 💊 Dori-darmonlar haqida\n- 🥗 Sog'lom ovqatlanish maslahatari\n- 🏥 Qaysi shifokorga murojaat qilish kerakligi\n\nSavolingizni yozing, birga hal qilamiz! 🤝",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          userMessage: messageText,
          messages: history,
        },
      });

      if (error) throw error;

      const aiMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data?.response ||
          data?.diagnosis ||
          "Kechirasiz, hozir javob bera olmayapman 😔. Iltimos, shifokorga murojaat qiling.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Kechirasiz 😔, AI xizmati hozir mavjud emas.\n\nIltimos, shifokorga bevosita murojaat qiling yoki qo'ng'iroq qiling. 📞🏥",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      toast.error("AI xizmati vaqtincha ishlamayapti");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Assalomu alaykum! 👋🩺\n\nMen **Medi AI** — sizning shaxsiy tibbiy yordamchingizman.\n\nSog'liq bo'yicha har qanday savolingizga ilmiy dalillarga asoslangan javob berishga tayyorman. 💡\n\nSavolingizni yozing, birga hal qilamiz! 🤝",
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-8rem)] flex flex-col rounded-2xl overflow-hidden border border-border bg-card"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-card to-primary/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow relative">
            <Bot size={22} className="text-primary-foreground" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground flex items-center gap-1.5">
              <Sparkles size={16} className="text-primary" />
              AI Tibbiy Yordamchi
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Stethoscope size={11} />
              Medi AI · Har doim tayyor · <Heart size={10} className="text-red-400" />
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          title="Suhbatni tozalash"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-2.5 border-b border-border flex gap-2 overflow-x-auto scrollbar-hide bg-card/80">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q.text}
            onClick={() => sendMessage(q.text)}
            disabled={loading}
            className="shrink-0 text-xs px-3.5 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 border border-primary/20 disabled:opacity-40 flex items-center gap-1.5 hover:scale-[1.02]"
          >
            <span>{q.emoji}</span>
            <span>{q.text}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-primary/15 text-primary ring-2 ring-primary/20"
                    : "gradient-primary text-primary-foreground shadow-glow"
                }`}
              >
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] space-y-1 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "gradient-primary text-primary-foreground rounded-br-md shadow-md"
                      : "bg-secondary/80 text-foreground rounded-bl-md border border-border/50 shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator — animated dots with pulse */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Bot size={16} className="text-primary-foreground" />
            </div>
            <div className="px-5 py-3.5 rounded-2xl rounded-bl-md bg-secondary/80 border border-border/50 flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Yozmoqda</span>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/60"
                  animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Savolingizni yozing... 💬"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all placeholder:text-muted-foreground/60"
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl gradient-primary text-primary-foreground disabled:opacity-40 shadow-glow transition-all hover:shadow-lg"
          >
            <Send size={20} />
          </motion.button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          ⚠️ AI maslahati professional tibbiy maslahat o'rnini bosmaydi
        </p>
      </div>
    </motion.div>
  );
};

export default AIChatModule;

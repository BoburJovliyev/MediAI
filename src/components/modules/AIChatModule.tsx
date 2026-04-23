import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Trash2, Sparkles, Stethoscope } from "lucide-react";
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
  "Bosh og'riqqa nima yordam beradi?",
  "Yurak kasalliklarining belgilari nima?",
  "Diabet bilan qanday ovqatlanish kerak?",
  "Bosim ko'tarilganda nima qilish kerak?",
];

const AIChatModule = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Salom! Men Medi AI tibbiy yordamchisiman. Sog'liq bo'yicha savollaringizga javob berishga tayyorman. Qanday yordam kera?",
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
      // Build conversation history for context
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => `${m.role === "user" ? "Bemor" : "Shifokor"}: ${m.content}`)
        .join("\n");

      const prompt = `Sen tajribali tibbiy yordamchi (AI)sin. Faqat tibbiyot va sog'liqqa oid savollarga javob ber. Uzbek tilida yoz. Qisqa va aniq bo'l (2-4 jumla). Agar jiddiy holat bo'lsa, shifokorga murojaat qilishni tavsiya qil.

${history ? `Avvalgi suhbat:\n${history}\n\n` : ""}Bemor savoli: ${messageText}

Tibbiy javob:`;

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          userMessage: messageText,
          messages: messages.filter((m) => m.id !== "welcome"),
        },
      });

      if (error) throw error;

      const aiMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data?.response ||
          data?.diagnosis ||
          "Kechirasiz, hozir javob bera olmayapman. Iltimos, shifokorga murojaat qiling.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      // Fallback local response
      const fallbackMsg: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Kechirasiz, AI xizmati hozir mavjud emas. Iltimos, shifokorga bevosita murojaat qiling yoki qo'ng'iroq qiling.",
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
          "Salom! Men Medi AI tibbiy yordamchisiman. Sog'liq bo'yicha savollaringizga javob berishga tayyorman. Qanday yordam kera?",
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
      <div className="p-4 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Bot size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-bold text-foreground flex items-center gap-1.5">
              <Sparkles size={16} className="text-primary" />
              AI Tibbiy Yordamchi
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Stethoscope size={11} />
              Medi AI · Har doim tayyor
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Suhbatni tozalash"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-2 border-b border-border flex gap-2 overflow-x-auto scrollbar-hide">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={loading}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-primary/10 text-primary"
                    : "gradient-primary text-primary-foreground shadow-glow"
                }`}
              >
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] space-y-1 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Bot size={16} className="text-primary-foreground" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-secondary flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/60"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Savolingizni yozing..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl gradient-primary text-primary-foreground disabled:opacity-40 shadow-glow"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          ⚠️ AI maslahati professional tibbiy maslahat o'rnini bosmaydi
        </p>
      </div>
    </motion.div>
  );
};

export default AIChatModule;

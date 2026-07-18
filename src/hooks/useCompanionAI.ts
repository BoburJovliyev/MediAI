import { useCallback, useEffect, useRef } from "react";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { supabase } from "@/integrations/supabase/client";

/**
 * Central AI hook that wires together:
 *  • Speech Recognition (Web Speech API – STT)
 *  • LLM processing (Supabase `ai-chat` edge function)
 *  • Speech Synthesis (Web Speech API – TTS) with audio analyser for lip-sync
 */

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

export function useCompanionAI() {
  const {
    character,
    speak: storeSpeak,
    stopSpeaking,
    setListening,
    setAudioLevel,
    setSpeechText,
    setMood,
    activity,
    audioEnabled,
  } = useCompanionStore();

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const conversationRef = useRef<{ role: string; content: string }[]>([]);

  /* voice parameters per character */
  const voiceParams = character === "boy"
    ? { pitch: 1.15, rate: 1.05 }
    : { pitch: 1.35, rate: 1.0 };

  /* ------------------------------------------------------------------ */
  /*  TTS with audio analyser for lip-sync                              */
  /* ------------------------------------------------------------------ */
  const speakText = useCallback(
    (text: string, mood?: Parameters<typeof storeSpeak>[1]) => {
      if (!audioEnabled || typeof window === "undefined" || !window.speechSynthesis) {
        // Just show text if audio disabled
        storeSpeak(text, mood);
        setTimeout(() => setSpeechText(""), 4000);
        return;
      }

      window.speechSynthesis.cancel();
      cancelAnimationFrame(animFrameRef.current);

      storeSpeak(text, mood);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "uz-UZ";
      utterance.pitch = voiceParams.pitch;
      utterance.rate = voiceParams.rate;
      utterance.volume = useCompanionStore.getState().audioVolume;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("uz") || v.lang.startsWith("tr") || v.lang.startsWith("ru")
      );
      if (preferred) utterance.voice = preferred;

      /* try setting up an analyser for lip-sync data */
      try {
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        /* pump audio level into Zustand store each frame */
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const pumpLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
          setAudioLevel(avg);
          animFrameRef.current = requestAnimationFrame(pumpLevel);
        };
        pumpLevel();
      } catch {
        /* AudioContext may not connect to speech synthesis on all browsers —
           fall back to a synthetic oscillation */
        const pumpFake = () => {
          setAudioLevel(0.3 + Math.random() * 0.4);
          animFrameRef.current = requestAnimationFrame(pumpFake);
        };
        pumpFake();
      }

      utterance.onend = () => {
        stopSpeaking();
        cancelAnimationFrame(animFrameRef.current);
        setAudioLevel(0);
        setTimeout(() => setSpeechText(""), 3000);
      };
      utterance.onerror = () => {
        stopSpeaking();
        cancelAnimationFrame(animFrameRef.current);
        setAudioLevel(0);
        setTimeout(() => setSpeechText(""), 4000);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [character, voiceParams, storeSpeak, stopSpeaking, setAudioLevel, setSpeechText, audioEnabled]
  );

  /* ------------------------------------------------------------------ */
  /*  LLM via Supabase Edge Function                                    */
  /* ------------------------------------------------------------------ */
  const sendToAI = useCallback(
    async (userText: string) => {
      conversationRef.current.push({ role: "user", content: userText });

      /* keep context window small */
      if (conversationRef.current.length > 12) {
        conversationRef.current = conversationRef.current.slice(-10);
      }

      const now = new Date();
      const hours = now.getHours();
      const timeOfDay = hours < 6 ? "tun" : hours < 12 ? "ertalab" : hours < 18 ? "kunduzi" : "kechqurun";

      const companionPrompt = `Sen "Sog'lom Hamroh" — sog'lom turmush tarzi bo'yicha do'stona 3D hamrohsan. 
Hozir vaqt: ${now.toLocaleTimeString("uz-UZ")} (${timeOfDay}).
Foydalanuvchi hozirgi faoliyati: ${activity}.
Foydalanuvchi ${character === "boy" ? "o'g'il bola" : "qiz bola"} hamrohini tanlagan.
Qisqa, samimiy va foydali javob ber (2-4 jumla). Emoji ishlat.`;

      try {
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: {
            userMessage: userText,
            messages: [
              { role: "system", content: companionPrompt },
              ...conversationRef.current,
            ],
          },
        });

        if (error) throw error;

        const response = data?.response || "Kechirasiz, tushunmadim. Qayta ayting.";
        conversationRef.current.push({ role: "assistant", content: response });
        speakText(response, "happy");
      } catch {
        speakText("Kechirasiz, hozir javob bera olmadim. Biroz kutib qayta urinib ko'ring.", "idle");
      }
    },
    [character, speakText, activity]
  );

  /* ------------------------------------------------------------------ */
  /*  STT — Speech Recognition                                         */
  /* ------------------------------------------------------------------ */
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speakText("Brauzeringiz ovozni taniy olmaydi. Chrome yoki Edge ishlating.", "idle");
      return;
    }

    /* stop any current speech */
    window.speechSynthesis?.cancel();

    const recognition = new SpeechRecognition();
    recognition.lang = "uz-UZ";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setListening(false);
        setMood("talking");
        sendToAI(transcript);
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speakText, sendToAI, setListening, setMood]);

  const stopListeningFn = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, [setListening]);

  /* cleanup */
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* greet on first load */
  useEffect(() => {
    const timer = setTimeout(() => {
      const hours = new Date().getHours();
      let greeting: string;
      if (hours < 6) greeting = "Salom! Tunda hali uyg'oqmisiz? Vaqtida uxlash kerak! 😴";
      else if (hours < 12) greeting = "Xayrli tong! 🌅 Bugun ajoyib kun bo'ladi. Qani, birga sog'lom kun boshlaymiz!";
      else if (hours < 18) greeting = "Assalomu alaykum! ☀️ Kun qanday o'tyapti? Sog'ligingizga e'tibor bering!";
      else greeting = "Xayrli kech! 🌙 Bugun yaxshi kun o'tkazdingizmi? Dam olish vaqti yaqinlashmoqda.";
      speakText(greeting, "happy");
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    speakText,
    startListening,
    stopListening: stopListeningFn,
    sendToAI,
  };
}

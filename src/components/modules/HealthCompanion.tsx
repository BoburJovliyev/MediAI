import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Clock, Utensils, Dumbbell, Activity, Moon, Sun, Camera, ChevronRight, CheckCircle2, User, UserPlus
} from "lucide-react";
import { toast } from "sonner";

type CharacterType = "boy" | "girl";
type TabType = "alarm" | "diet" | "fitness";

const HealthCompanion = () => {
  const [character, setCharacter] = useState<CharacterType>("boy");
  const [activeTab, setActiveTab] = useState<TabType>("alarm");

  // Character speaking bubble
  const [speechText, setSpeechText] = useState("");
  
  const speak = (text: string) => {
    setSpeechText(text);
    setTimeout(() => setSpeechText(""), 5000);
  };

  useEffect(() => {
    if (character === "boy") {
      speak("Salom! Men sizning sog'lom hayot bo'yicha hamrohingizman. Keling, birga shug'ullanamiz!");
    } else {
      speak("Assalomu alaykum! Men sizga to'g'ri ovqatlanish va vaqtida uxlashni eslatib turaman.");
    }
  }, [character]);

  // --- ALARM STATE ---
  const [sleepTime, setSleepTime] = useState("22:30");
  const [wakeTime, setWakeTime] = useState("06:00");
  const [alarmActive, setAlarmActive] = useState(false);

  const toggleAlarm = () => {
    setAlarmActive(!alarmActive);
    if (!alarmActive) {
      toast.success("Budilnik yoqildi! Vaqtida uxlashni unutmang.");
      speak("Ajoyib! Bugun o'z vaqtida uxlab, erta tongda uyg'onamiz.");
    } else {
      toast("Budilnik o'chirildi.");
      speak("Budilnik o'chirildi. Rejimni buzmang!");
    }
  };

  // --- DIET STATE ---
  const [foodImage, setFoodImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [calories, setCalories] = useState<{ name: string; cal: number; status: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setFoodImage(e.target?.result as string);
    reader.readAsDataURL(file);

    setAnalyzing(true);
    setCalories(null);
    speak("Taomni tahlil qilyapman. Qani ko'raylikchi, bu qanchalik foydali ekan...");

    setTimeout(() => {
      setAnalyzing(false);
      const isHealthy = Math.random() > 0.4;
      const cals = Math.floor(Math.random() * 500) + 150;
      setCalories({
        name: "Taniqsiz taom",
        cal: cals,
        status: isHealthy ? "Sog'lom" : "Og'ir taom",
      });
      if (isHealthy) {
        speak(`Bu juda zo'r taom! ${cals} kaloriya. Buni bemalol yeyishingiz mumkin.`);
      } else {
        speak(`Bu biroz og'irroq taom (${cals} kkal). Buni yesangiz ko'proq yugurishingiz kerak bo'ladi!`);
      }
    }, 2500);
  };

  // --- FITNESS STATE ---
  const exercises = [
    { id: 1, name: "Ertalabki yugurish", time: "15 min", cals: "120 kkal", icon: <Activity size={20} /> },
    { id: 2, name: "Qo'llar uchun mashq", time: "10 min", cals: "80 kkal", icon: <Dumbbell size={20} /> },
    { id: 3, name: "Yengil chigalyozdi", time: "5 min", cals: "30 kkal", icon: <HeartPulse size={20} /> },
  ];

  const startExercise = (name: string) => {
    toast.success(`${name} mashqi boshlandi!`);
    speak(`Qani, ketdik! ${name} mashqini men bilan birga bajaring! Bir, ikki, uch...`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
          <HeartPulse className="text-primary" /> Sog'lom Hamroh
        </h2>
        <p className="text-muted-foreground mt-1">
          Sizning shaxsiy 3D hamrohingiz. Sog'lom turmush tarzi, uyqu, ovqatlanish va mashqlarni birga bajaramiz!
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* CHARACTER SECTION (LEFT) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-3xl p-5 shadow-card flex flex-col items-center relative overflow-hidden h-[500px]">
            
            {/* Speech Bubble */}
            <AnimatePresence>
              {speechText && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute top-6 left-1/2 -translate-x-1/2 w-3/4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-4 rounded-2xl shadow-xl z-20 border border-slate-100 dark:border-slate-700 font-medium text-sm text-center"
                >
                  {speechText}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 rotate-45 border-r border-b border-slate-100 dark:border-slate-700"></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3D Character View */}
            <motion.div
              animate={{ 
                scale: [1, 1.02, 1],
                y: [0, -5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4, 
                ease: "easeInOut" 
              }}
              className="w-full h-full relative rounded-2xl overflow-hidden mt-8"
              style={{
                backgroundImage: 'url(/characters.jpg)',
                backgroundSize: '200% 100%',
                backgroundPosition: character === "boy" ? "left center" : "right center",
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Optional glowing effect at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>
            </motion.div>

            {/* Character Selector */}
            <div className="absolute bottom-6 bg-card/80 backdrop-blur-md p-1.5 rounded-full border border-border shadow-sm flex gap-1 z-10">
              <button
                onClick={() => setCharacter("boy")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  character === "boy" ? "bg-blue-500 text-white shadow-md" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                O'g'il bola
              </button>
              <button
                onClick={() => setCharacter("girl")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  character === "girl" ? "bg-pink-500 text-white shadow-md" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                Qiz bola
              </button>
            </div>
          </div>
        </div>

        {/* FEATURES SECTION (RIGHT) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Tabs */}
          <div className="flex bg-secondary p-1 rounded-2xl">
            <button
              onClick={() => { setActiveTab("alarm"); speak("Vaqtida uxlash sog'lik uchun eng muhim narsa!"); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "alarm" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock size={18} /> Budilnik
            </button>
            <button
              onClick={() => { setActiveTab("diet"); speak("Nima yeyayotganingizni bilish - sog'lom tananing siri."); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "diet" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Utensils size={18} /> Ratsion
            </button>
            <button
              onClick={() => { setActiveTab("fitness"); speak("Harakatda barakat! Keling ozgina badantarbiya qilamiz."); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "fitness" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Dumbbell size={18} /> Badantarbiya
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            
            {/* ALARM TAB */}
            {activeTab === "alarm" && (
              <motion.div
                key="alarm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-card"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Moon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Uyqu Nazorati</h3>
                    <p className="text-sm text-muted-foreground">O'z vaqtida uxlashni odat qiling</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Moon size={16} /> Uxlash vaqti
                    </label>
                    <input 
                      type="time" 
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      disabled={alarmActive}
                      className="w-full text-3xl font-display font-bold bg-secondary/50 border border-border rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Sun size={16} /> Uyg'onish vaqti
                    </label>
                    <input 
                      type="time" 
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      disabled={alarmActive}
                      className="w-full text-3xl font-display font-bold bg-secondary/50 border border-border rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  onClick={toggleAlarm}
                  className={`w-full py-4 rounded-2xl text-lg font-bold transition-all shadow-md active:scale-[0.98] flex justify-center items-center gap-2 ${
                    alarmActive 
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                      : "gradient-primary text-white hover:opacity-90"
                  }`}
                >
                  {alarmActive ? "Budilnikni O'chirish" : "Budilnikni Yoqish"}
                </button>
              </motion.div>
            )}

            {/* DIET TAB */}
            {activeTab === "diet" && (
              <motion.div
                key="diet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-card"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Utensils size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Kunlik Ratsion AI</h3>
                    <p className="text-sm text-muted-foreground">Ovqatni rasmga oling va kaloriya hisoblang</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Upload Area */}
                  <div className="flex-1">
                    <label className="border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer h-full min-h-[200px] relative overflow-hidden group">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      {foodImage ? (
                        <>
                          <img src={foodImage} alt="Food" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                          <div className="z-10 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2">
                            <Camera size={16} /> Boshqa rasm yuklash
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
                            <Camera size={32} />
                          </div>
                          <p className="font-semibold text-foreground">Ovqat rasmini yuklang</p>
                          <p className="text-xs text-muted-foreground mt-2">AI tahlili uchun rasmga oling yoki galereyadan tanlang</p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Results Area */}
                  <div className="flex-1 flex flex-col">
                    {analyzing ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-secondary/50 rounded-3xl">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="font-medium animate-pulse">AI Tahlil qilmoqda...</p>
                      </div>
                    ) : calories ? (
                      <div className="flex-1 flex flex-col justify-center p-6 bg-secondary/30 rounded-3xl border border-border">
                        <div className="flex items-center gap-2 mb-2 text-medical-green font-semibold">
                          <CheckCircle2 size={20} /> Tahlil yakunlandi
                        </div>
                        <h4 className="text-2xl font-bold mb-1">{calories.cal} <span className="text-lg text-muted-foreground font-normal">kkal</span></h4>
                        <p className="text-foreground font-medium mb-4">{calories.name}</p>
                        
                        <div className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex w-max ${
                          calories.status === "Sog'lom" ? "bg-medical-green-light text-medical-green" : "bg-medical-orange-light text-medical-orange"
                        }`}>
                          Holat: {calories.status}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-secondary/50 rounded-3xl border border-border border-dashed text-center">
                        <Utensils size={32} className="text-muted-foreground mb-3 opacity-50" />
                        <p className="text-muted-foreground text-sm">Natijani ko'rish uchun rasm yuklang</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* FITNESS TAB */}
            {activeTab === "fitness" && (
              <motion.div
                key="fitness"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-card"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-medical-blue-light text-medical-blue flex items-center justify-center">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Badantarbiya</h3>
                    <p className="text-sm text-muted-foreground">Men bilan birga mashq qiling!</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {exercises.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between p-4 bg-secondary rounded-2xl border border-border/50 hover:border-primary/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                          {ex.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{ex.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Clock size={12} /> {ex.time}</span>
                            <span className="flex items-center gap-1"><HeartPulse size={12} /> {ex.cals}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => startExercise(ex.name)}
                        className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-2xl border border-primary/20 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                    <Dumbbell size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Muntazam harakat — sog'lik garovi!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Kuniga kamida 15 daqiqa ajrating.</p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default HealthCompanion;

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Camera, Save, Loader2, Calendar, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { format } from "date-fns";
import { validateUpload, validateImageDimensions, MAX_AVATAR_DIMENSION } from "@/lib/uploadValidation";

const ProfilePage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [about, setAbout] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url);
          // Parse metadata from user
          const meta = user.user_metadata || {};
          setAge(meta.age || "");
          setGender(meta.gender || "");
          setSpecialty(meta.specialty || "");
          setAbout(meta.about || "");
        }
      });
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    const valid = validateUpload(file, "avatar");
    if (!valid.ok) { toast.error(valid.error!); return; }
    const dim = await validateImageDimensions(file, MAX_AVATAR_DIMENSION);
    if (!dim.ok) { toast.error(dim.error!); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    // Avatars stay in the PUBLIC chat-files bucket so they're viewable everywhere.
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("chat-files").upload(path, file, { upsert: true });
    if (error) {
      toast.error(t("profile.error"));
      setUploading(false);
      return;
    }
    // Cache-bust so the new avatar shows immediately.
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(path);
    urlData.publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;
    setAvatarUrl(urlData.publicUrl);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    await supabase.auth.updateUser({
      data: { full_name: fullName, age, gender, specialty, about },
    });
    toast.success(t("profile.saved"));
    setSaving(false);
  };

  if (!profile) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">{t("profile.title")}</h2>

      <div className="bg-card rounded-2xl p-8 border border-border shadow-card space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-primary/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-primary" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-glow"
              disabled={uploading}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
          </div>
          <p className="text-xs text-muted-foreground">{t("profile.uploadAvatar")}</p>
        </div>

        {/* Info */}
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.fullName")}</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.age")}</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.gender")}</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">—</option>
                <option value="male">{t("auth.male")}</option>
                <option value="female">{t("auth.female")}</option>
              </select>
            </div>
          </div>

          {profile.role === "doctor" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.specialty")}</label>
              <input value={specialty} onChange={e => setSpecialty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.aboutYou")}</label>
            <textarea value={about} onChange={e => setAbout(e.target.value)} rows={3}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><Shield size={14} /> {t("profile.role")}: <span className="capitalize font-medium text-foreground">{profile.role}</span></div>
          <div className="flex items-center gap-1"><Calendar size={14} /> {t("profile.joinedAt")}: {format(new Date(profile.created_at), "dd.MM.yyyy")}</div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-glow disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {t("profile.save")}</>}
        </button>
      </div>
    </motion.div>
  );
};

export default ProfilePage;

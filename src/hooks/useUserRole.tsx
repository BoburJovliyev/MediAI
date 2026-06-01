import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserRole = "admin" | "doctor" | "patient" | "user";

/**
 * Resolves the current user's primary role.
 * Returns { role, loading } where role defaults to "user".
 */
export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setRole("user");
      setLoading(false);
      return;
    }
    setLoading(true);
    const check = async () => {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as any });
      if (!active) return;
      if (isAdmin) { setRole("admin"); setLoading(false); return; }
      const { data: isDoctor } = await supabase.rpc("has_role", { _user_id: user.id, _role: "doctor" as any });
      if (!active) return;
      if (isDoctor) { setRole("doctor"); setLoading(false); return; }
      const { data: isPatient } = await supabase.rpc("has_role", { _user_id: user.id, _role: "patient" as any });
      if (!active) return;
      if (isPatient) { setRole("patient"); setLoading(false); return; }
      setRole("user");
      setLoading(false);
    };
    check();
    return () => { active = false; };
  }, [user]);

  const isDoctor = role === "doctor" || role === "admin";

  return { role, isDoctor, loading };
};

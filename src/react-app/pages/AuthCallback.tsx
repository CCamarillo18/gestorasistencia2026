import { useEffect } from "react";
import { useNavigate } from "react-router";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { supabase } from "@/react-app/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await supabase.auth.exchangeCodeForSession(window.location.href);
        navigate("/dashboard");
      } catch (error) {
        console.error("Error durante la autenticación:", error);
        const hash = window.location.hash || "";
        if (hash.includes("access_token")) {
          try {
            const params = new URLSearchParams(hash.replace(/^#/, ""));
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token") || "";
            if (access_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
              navigate("/dashboard");
              return;
            }
          } catch (e) {
            console.error("Fallback hash auth error:", e);
          }
        }
        navigate("/");
      }
    };

    handleCallback();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/dashboard");
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

  return <LoadingSpinner />;
}

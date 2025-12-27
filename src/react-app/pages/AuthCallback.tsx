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
        navigate("/");
      }
    };

    handleCallback();
  }, [navigate]);

  return <LoadingSpinner />;
}

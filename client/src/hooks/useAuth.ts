import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Clear auth cache when logout parameter is present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
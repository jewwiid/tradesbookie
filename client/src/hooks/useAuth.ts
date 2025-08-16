import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error('Failed to fetch user');
      }
      
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    staleTime: 0, // Always fresh - immediately invalidate on changes
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      // Return cached null to prevent API calls
      return null;
    },
    enabled: false, // Disable automatic execution
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });

  return {
    user,
    isLoading: false, // Always false since we're not fetching
    isAuthenticated: false, // Always false for now to prevent auth loops
  };
}
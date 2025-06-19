import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Check for admin session in localStorage
  const getAdminSession = () => {
    try {
      const session = localStorage.getItem("adminSession");
      return session ? JSON.parse(session) : null;
    } catch (error) {
      localStorage.removeItem("adminSession");
      return null;
    }
  };

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const adminSession = getAdminSession();
  const currentUser = adminSession || user;
  const isAuthenticated = !!(adminSession || user);

  return {
    user: currentUser,
    isLoading: !adminSession && isLoading,
    isAuthenticated,
  };
}
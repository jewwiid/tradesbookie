import { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StoreLoginForm {
  email: string;
  password: string;
}

interface StoreUser {
  id: number;
  email: string;
  storeName: string;
  retailerCode: string;
  storeCode?: string;
}

interface StoreLoginResponse {
  success: boolean;
  message: string;
  storeUser: StoreUser;
  token: string;
}

export default function StoreLogin() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/store/:retailerName");
  const { toast } = useToast();

  const [form, setForm] = useState<StoreLoginForm>({
    email: "",
    password: ""
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Extract retailer name from URL
  const retailerName = params?.retailerName ? decodeURIComponent(params.retailerName.replace(/-/g, ' ')) : '';

  const loginMutation = useMutation({
    mutationFn: async (formData: StoreLoginForm): Promise<StoreLoginResponse> => {
      const response = await apiRequest("POST", "/api/store/login", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: data.message
      });
      // Redirect to store dashboard
      setLocation(`/store/${params?.retailerName}/dashboard`);
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (formData: StoreLoginForm & { retailerName: string }) => {
      const response = await apiRequest("POST", "/api/store/register", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: data.message
      });
      setIsRegistering(false);
      setShowRegister(false);
      // After successful registration, try to login
      loginMutation.mutate(form);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.email || !form.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (showRegister) {
      setIsRegistering(true);
      registerMutation.mutate({
        ...form,
        retailerName: retailerName
      });
    } else {
      loginMutation.mutate(form);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {showRegister ? 'Register Store Account' : 'Store Login'}
            </CardTitle>
            <CardDescription>
              {retailerName ? (
                <>Access your {retailerName} store dashboard to track QR codes and staff referrals</>
              ) : (
                <>Access your store dashboard to track QR codes and staff referrals</>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {retailerName && (
                <Alert>
                  <Store className="h-4 w-4" />
                  <AlertDescription>
                    Logging in for: <strong>{retailerName}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your store email"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {showRegister ? 'Store Code/Password' : 'Store Code/Password'}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={showRegister ? "Enter your store code (e.g., BLA, CKM)" : "Enter your store code/password"}
                  value={form.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {showRegister ? 'Create Store Account' : 'Sign In'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center">
            <div className="w-full space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {showRegister ? 'Already have an account?' : "Don't have a store account?"}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowRegister(!showRegister);
                  setForm({ email: "", password: "" });
                }}
                disabled={isLoading}
              >
                {showRegister ? 'Sign In Instead' : 'Create Store Account'}
              </Button>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                <p>First time? Your email will be set on initial login.</p>
                <p>Use your store code as the password.</p>
              </div>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Supported Retailers:</p>
          <p>Harvey Norman • Currys • DID Electrical • Power City • Argos • Expert • Radio TV World</p>
        </div>
      </div>
    </div>
  );
}
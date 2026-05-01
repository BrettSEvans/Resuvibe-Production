import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Listen for password recovery event from the magic link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { data: updateData, error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    // Recovery flow already establishes a session — keep user signed in and route based on onboarding state
    let nextPath = "/";
    const userId = updateData?.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", userId)
        .single();
      if (!profile?.onboarding_completed_at) {
        nextPath = "/onboarding";
      }
    }
    setLoading(false);
    setSuccess(true);
    toast.success("Password updated successfully!");
    setTimeout(() => navigate(nextPath, { replace: true }), 1200);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border text-center">
          <CardHeader className="space-y-2">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-xl">Password Updated!</CardTitle>
            <CardDescription>Signing you in...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border text-center">
          <CardHeader className="space-y-2">
            <div className="flex justify-center mb-2">
              <BrandLogo iconSize="2.4em" />
            </div>
            <CardTitle className="text-xl">Password Reset</CardTitle>
            <CardDescription>Waiting for recovery link verification...</CardDescription>
            <CardDescription className="text-xs">If you arrived here directly, please use the reset link from your email.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate("/login")}>Back to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BrandLogo iconSize="2.4em" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">Set New Password</CardTitle>
          <CardDescription>Enter and confirm your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9" required minLength={6} />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-9 pr-9" required minLength={6} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || password !== confirmPassword}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

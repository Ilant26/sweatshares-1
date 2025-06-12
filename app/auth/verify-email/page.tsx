"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { verifyEmail, resendVerificationEmail } from "@/lib/auth";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name=otp-${index + 1}]`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[name=otp-${index - 1}]`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email address is missing");
      return;
    }

    setIsLoading(true);
    const otpString = otp.join("");
    
    try {
      const { error } = await verifyEmail(email, otpString);
      if (error) throw error;
      
      toast.success("Email verified successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email address is missing");
      return;
    }

    setIsResending(true);
    try {
      const { error } = await resendVerificationEmail(email);
      if (error) throw error;
      
      toast.success("Verification code resent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification code");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Invalid Request</CardTitle>
            <CardDescription className="text-center">
              Email address is missing. Please try signing up again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/auth/sign-up")}>
              Go to Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit code sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  name={`otp-${index}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={cn(
                    "h-12 w-12 text-center text-lg",
                    "focus:ring-2 focus:ring-primary"
                  )}
                />
              ))}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || otp.some(digit => !digit)}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify Email
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                disabled={isResending}
                onClick={handleResendCode}
              >
                {isResending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend code"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
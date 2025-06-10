import { AuthUI } from "@/components/auth-ui";

export default function ForgotPasswordPage() {
  return (
    <AuthUI
      image={{
        src: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1376&q=80",
        alt: "Forgot password background"
      }}
      quote={{
        text: "Don't worry, we'll help you get back into your account.",
        author: "SweatShares Team"
      }}
    />
  );
} 
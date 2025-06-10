import { AuthUI } from "@/components/auth-ui";

export default function SignUpPage() {
  return (
    <AuthUI
      image={{
        src: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1376&q=80",
        alt: "Sign up background"
      }}
      quote={{
        text: "Start your journey with SweatShares and connect with like-minded professionals.",
        author: "SweatShares Team"
      }}
    />
  );
} 
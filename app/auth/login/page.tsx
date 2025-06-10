import { AuthUI } from "@/components/auth-ui";

export default function LoginPage() {
  return (
    <AuthUI
      image={{
        src: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1376&q=80",
        alt: "Login background"
      }}
      quote={{
        text: "Join our community of founders, experts, and investors to collaborate on innovative projects.",
        author: "SweatShares Team"
      }}
    />
  );
} 
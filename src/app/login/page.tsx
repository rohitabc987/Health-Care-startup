import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

export const metadata = {
  title: "Patient Sign In • Pronto Health",
  description: "Sign in to Pronto Health with direct 10-digit mobile verification.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}

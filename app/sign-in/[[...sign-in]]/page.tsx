import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { connection } from "next/server";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md rounded-4xl border border-white/10 bg-white p-6 shadow-2xl">
        <Suspense fallback={<AuthFallback />}>
          <SignInPane />
        </Suspense>
      </div>
    </main>
  );
}

async function SignInPane() {
  await connection();

  return <SignIn withSignUp />;
}

function AuthFallback() {
  return <div className="h-[480px] animate-pulse rounded-3xl bg-slate-100" />;
}

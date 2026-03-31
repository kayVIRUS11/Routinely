"use client";

import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setResent(true);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm text-center">
      <Link href="/sign-up" className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-2">Check your inbox</h1>
      <p className="text-text-secondary text-sm mb-8">
        We sent a verification link to your email address. Click the link to activate your account.
      </p>

      {resent ? (
        <p className="text-success text-sm mb-4">Email resent successfully!</p>
      ) : (
        <Button variant="secondary" onClick={handleResend} loading={loading} className="mb-4">
          Resend verification email
        </Button>
      )}

      <p className="text-xs text-text-secondary">
        Already verified?{" "}
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

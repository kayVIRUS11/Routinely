"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm">
      <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to sign in
      </Link>

      {sent ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Link sent!</h1>
          <p className="text-text-secondary text-sm">
            Check your inbox for the password reset link.
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Reset password</h1>
          <p className="text-text-secondary text-sm mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Send reset link
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

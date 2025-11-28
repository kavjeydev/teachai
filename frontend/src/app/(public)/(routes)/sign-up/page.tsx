"use client";

import { useState } from "react";
import { useSignUp, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { signUp, isLoaded } = useSignUp();
  const { setActive } = useClerk();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  // Redirect if already signed in
  if (isLoaded && isSignedIn) {
    router.push("/dashboard");
    return null;
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || !isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || !isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: "google" | "github") => {
    if (!signUp || !isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      await signUp.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || `Failed to sign up with ${provider}.`);
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  // Show verification form if email code was sent
  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <div className="flex justify-center mb-8">
            <Image
              src="/trainly_icon_white.png"
              alt="Trainly Logo"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </div>

          <h1 className="text-2xl font-semibold text-white text-center mb-4">
            Verify your email
          </h1>

          <p className="text-[#999999] text-sm text-center mb-8">
            We sent a verification code to {email}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-white text-sm font-medium">
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isLoading}
                className="bg-[#1F1F1F] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#555555] disabled:opacity-50"
                placeholder="Enter verification code"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify email"
              )}
            </Button>
          </form>

          <p className="text-center text-[#999999] text-sm mt-6">
            <button
              onClick={() => setPendingVerification(false)}
              className="text-white hover:underline"
            >
              Back to sign up
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/trainly_icon_white.png"
            alt="Trainly Logo"
            width={48}
            height={48}
            className="w-12 h-12"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-white text-center mb-8">
          Create your account
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            type="button"
            onClick={() => handleOAuthSignUp("google")}
            disabled={isLoading}
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            Continue with Google
          </Button>

          <Button
            type="button"
            onClick={() => handleOAuthSignUp("github")}
            disabled={isLoading}
            className="w-full bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white font-medium py-3 rounded-lg border border-[#333333] transition-colors disabled:opacity-50"
          >
            Continue with GitHub
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333333]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-black text-[#999999]">Or</span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white text-sm font-medium">
                First name
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
                className="bg-[#1F1F1F] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#555555] disabled:opacity-50"
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white text-sm font-medium">
                Last name
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
                className="bg-[#1F1F1F] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#555555] disabled:opacity-50"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="bg-[#1F1F1F] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#555555] disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="bg-[#1F1F1F] border-[#333333] text-white placeholder:text-[#666666] focus:border-[#555555] disabled:opacity-50"
              placeholder="Create a password"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white font-medium py-3 rounded-lg border border-[#333333] transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Continue with email"
            )}
          </Button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-[#999999] text-sm mt-8">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-white hover:underline font-medium"
          >
            Log in
          </Link>{" "}
          or{" "}
          <Link
            href="/about"
            className="text-white hover:underline font-medium"
          >
            learn more
          </Link>
        </p>
      </div>
    </div>
  );
}


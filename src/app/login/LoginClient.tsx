"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile, getStoredUserProfile } from "@/lib/firebase";
import {
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  User,
  Calendar,
  BadgeCheck
} from "lucide-react";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const { login, isAuthenticated } = useAuth();

  const [step, setStep] = useState<"phone" | "otp" | "onboarding">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Partial user data from verification
  const [verifiedUser, setVerifiedUser] = useState<any>(null);

  // Onboarding form state for new patients
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // If already authenticated and not in onboarding, redirect away
  useEffect(() => {
    if (isAuthenticated && step !== "onboarding") {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router, step]);

  // Resend countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    setErrorMsg("");
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${phone}` }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }

      setStep("otp");
      setCountdown(30);
      setIsLoading(false);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dispatch verification code");
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg("");

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5 && newOtp.every((d) => d !== "")) {
      verifyCode(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const splitDigits = pasted.split("");
      setOtp(splitDigits);
      otpInputRefs.current[5]?.focus();
      verifyCode(pasted);
    }
  };

  const verifyCode = async (codeString?: string) => {
    const codeToVerify = codeString || otp.join("");
    if (codeToVerify.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the code");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+91${phone}`,
          otp: codeToVerify,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setIsLoading(false);

      // Check if user already completed profile in localStorage or server
      const stored = getStoredUserProfile();
      const isAlreadyConfigured =
        (stored &&
          (stored.uid === data.user?.uid || stored.phone === data.user?.phone) &&
          stored.name &&
          !stored.isNewUser &&
          !stored.name.startsWith("Patient (+91")) ||
        (data.user && !data.user.isNewUser && data.user.name && !data.user.name.startsWith("Patient (+91"));

      if (isAlreadyConfigured) {
        const finalUser = {
          ...data.user,
          ...(stored && (stored.uid === data.user?.uid || stored.phone === data.user?.phone) ? stored : {}),
          isNewUser: false,
        };
        login(finalUser);
        router.push(redirectUrl);
      } else if (data.user?.isNewUser) {
        setVerifiedUser(data.user);
        setStep("onboarding");
      } else {
        // Returning patient: immediate login & redirect
        login(data.user);
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid OTP code. Please retry.");
      setIsLoading(false);
    }
  };

  const fillTestOtp = () => {
    if (devOtpHint && devOtpHint.length === 6) {
      const digits = devOtpHint.split("");
      setOtp(digits);
      verifyCode(devOtpHint);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setErrorMsg("Please enter a valid age (1-120)");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const finalUser = {
        ...verifiedUser,
        name: fullName.trim(),
        age: ageNum,
        gender,
        isNewUser: false,
      };

      await updateUserProfile(finalUser.uid, finalUser);
      login(finalUser);
      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not save profile. Please retry.");
      setIsLoading(false);
    }
  };

  const isBookingRedirect = redirectUrl.includes("booking");

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* Centered Login Card Container */}
      <div className="w-full min-h-[calc(100vh-170px)] flex flex-col justify-center items-center py-2 sm:py-6 px-0 sm:px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl sm:border sm:border-gray-150 sm:shadow-lg overflow-hidden p-4 py-8 md:p-10 md:px-12">

          {/* Top Back Row inside Card */}
          {/* <div className="flex items-center justify-between mb-4">
            <Link
              href={redirectUrl || "/"}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Patient Sign In
            </span>
          </div> */}

          {/* Step Titles - Centered */}
          <div className="mb-5 text-center">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {step === "phone" && "Enter your mobile number"}
              {step === "otp" && "Verify with WhatsApp OTP"}
              {step === "onboarding" && "What's your name?"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-xs mx-auto">
              {step === "phone" && "We will send a 6-digit verification code directly to your WhatsApp"}
              {step === "otp" && (
                <span>
                  Code sent via WhatsApp to <strong className="text-gray-800 font-semibold">+91 {phone}</strong> •{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp(["", "", "", "", "", ""]);
                      setErrorMsg("");
                    }}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Edit
                  </button>
                </span>
              )}
              {step === "onboarding" && "Required for clinic follow-up passes & digital prescriptions"}
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium text-center animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Phone Entry */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5 flex items-center justify-between">
                  <span>Mobile Number (WhatsApp)</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    WhatsApp OTP
                  </span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full pl-20 pr-3.5 py-3 bg-gray-50/50 hover:bg-white focus:bg-white text-sm sm:text-base font-semibold tracking-wider text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Buttons: Sleeker Continue + Skip for now */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || phone.length < 10}
                  className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Sending Code...
                    </span>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {!isBookingRedirect && (
                  <Link
                    href={redirectUrl || "/"}
                    className="w-full py-2 text-gray-600 font-semibold rounded-xl text-xs flex items-center justify-center transition-all text-center"
                  >
                    Skip for now
                  </Link>
                )}
              </div>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed pt-1">
                By continuing, you agree to our{" "}
                <span className="text-gray-500 underline">Terms of Service</span> and{" "}
                <span className="text-gray-500 underline">Privacy Policy</span>.
              </p>
            </form>
          )}

          {/* STEP 2: OTP Entry */}
          {step === "otp" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2 text-center">
                  6-Digit Verification Code
                </label>

                {/* 6 Digit Inputs */}
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-full h-11 sm:h-12 text-center text-lg font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  ))}
                </div>

                {devOtpHint && (
                  <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                    <span className="text-[11px] text-emerald-800 font-medium">
                      Verification code: <strong className="font-mono">{devOtpHint}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={fillTestOtp}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-2xs transition-colors"
                    >
                      1-Tap Fill
                    </button>
                  </div>
                )}
              </div>

              {/* Buttons: Sleeker Verify + Skip */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => verifyCode()}
                  disabled={isLoading || otp.some((d) => d === "")}
                  className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify &amp; Continue</span>
                    </>
                  )}
                </button>

                {!isBookingRedirect && (
                  <Link
                    href={redirectUrl || "/"}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 active:scale-[0.99] text-gray-600 hover:text-gray-900 font-semibold rounded-xl text-xs flex items-center justify-center transition-all text-center"
                  >
                    Skip for now
                  </Link>
                )}
              </div>

              <div className="text-center pt-1">
                {countdown > 0 ? (
                  <p className="text-[11px] text-gray-400">
                    Resend SMS in <span className="font-mono font-bold text-gray-700">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend OTP via SMS</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Onboarding Details (New Patients) */}
          {step === "onboarding" && (
            <form onSubmit={handleCompleteOnboarding} className="space-y-3.5">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mobile verified! Please provide basic details for doctor prescriptions.</span>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    autoFocus
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm font-semibold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Age & Gender in 2 Columns */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Age */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 28"
                      required
                      className="w-full pl-9 pr-2.5 py-2.5 bg-gray-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm font-semibold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
                    className="w-full px-3 py-2.5 bg-gray-50/50 hover:bg-white focus:bg-white text-xs sm:text-sm font-semibold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !fullName.trim() || !age}
                  className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Saving Profile...
                    </span>
                  ) : (
                    <>
                      <span>Finish &amp; Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <Link
                  href={redirectUrl || "/"}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 active:scale-[0.99] text-gray-600 hover:text-gray-900 font-semibold rounded-xl text-xs flex items-center justify-center transition-all text-center"
                >
                  Skip for now
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

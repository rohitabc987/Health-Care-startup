"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/firebase";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  Lock,
  User,
  Calendar,
  BadgeCheck
} from "lucide-react";

interface PhoneLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhoneLoginModal({ isOpen, onClose }: PhoneLoginModalProps) {
  const { login } = useAuth();
  const [step, setStep] = useState<"phone" | "otp" | "onboarding">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // New patient onboarding state
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 10
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

      setDevOtpHint(data.devOtp || "123456");
      setStep("otp");
      setCountdown(30);
      setIsLoading(false);

      // Auto-focus first OTP input after switching
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dispatch SMS code");
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg("");

    // Auto advance
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
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

      if (data.user?.isNewUser) {
        setVerifiedUser(data.user);
        setStep("onboarding");
      } else {
        login(data.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid OTP code");
      setIsLoading(false);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name for prescriptions");
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
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Could not save profile. Please retry.");
      setIsLoading(false);
    }
  };

  const fillTestNumber = () => {
    setPhone("9876543210");
    setErrorMsg("");
  };

  const fillTestOtp = () => {
    const testCode = devOtpHint || "123456";
    setOtp(testCode.split(""));
    verifyCode(testCode);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-150 flex flex-col sm:py-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="w-8" />
          <div className="text-center">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
              {step === "phone" ? "Enter your mobile number" : step === "otp" ? "Verify with OTP" : "Complete Your Profile"}
            </h3>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {step === "phone" ? "We will send a 6-digit OTP to verify" : step === "otp" ? `Code sent to +91 ${phone}` : "Basic details for doctor prescriptions"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium text-center animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Mobile Number
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
                    className="w-full pl-20 pr-3.5 py-2.5 bg-white text-sm font-semibold tracking-wider text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

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

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-gray-600 hover:text-gray-900 font-semibold rounded-xl text-xs flex items-center justify-center transition-all text-center"
                >
                  Skip for now
                </button>
              </div>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                By continuing, you agree to our Terms &amp; Privacy Policy.
              </p>
            </form>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700">
                    6-Digit SMS Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="text-[11px] text-emerald-700 hover:underline font-semibold"
                  >
                    Change Number
                  </button>
                </div>

                {/* 6 Digit Inputs */}
                <div className="grid grid-cols-6 gap-2">
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
                      className="w-full h-12 text-center text-lg font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  ))}
                </div>
              </div>

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

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 active:scale-[0.99] text-gray-600 hover:text-gray-900 font-semibold rounded-xl text-xs flex items-center justify-center transition-all text-center"
                >
                  Skip for now
                </button>
              </div>

              <div className="text-center pt-1">
                {countdown > 0 ? (
                  <p className="text-[11px] text-gray-400">
                    Resend code in <span className="font-mono font-bold text-gray-700">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend SMS Code</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {step === "onboarding" && (
            <form onSubmit={handleCompleteOnboarding} className="space-y-3.5">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified! Please enter your name and age for prescriptions.</span>
              </div>

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
                    className="w-full pl-9 pr-3 py-2.5 bg-white text-sm font-semibold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
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
                      className="w-full pl-9 pr-2 py-2.5 bg-white text-sm font-semibold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["male", "female", "other"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-2 text-[10px] font-bold rounded-xl border capitalize transition-all ${gender === g
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        {g === "male" ? "M" : g === "female" ? "F" : "O"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 active:scale-[0.99] text-gray-600 hover:text-gray-900 font-semibold rounded-xl text-xs flex items-center justify-center transition-all text-center"
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

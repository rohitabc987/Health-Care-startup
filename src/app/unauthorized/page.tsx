
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export const metadata = {
  title: "Access Restricted | Pronto Health",
  description: "You do not have permission to access this page.",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 text-center max-w-md mx-auto shadow-md space-y-5 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-2xs">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
            403 • Access Restricted
          </span>
          <h1 className="text-xl font-black text-gray-900 pt-1">Not Authorized</h1>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            You do not have permission to access this administrative portal. This area is strictly restricted to authorized clinic operations personnel.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <Link
            href="/"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <Link
            href="/login"
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-[0.99] text-gray-800 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-gray-600" />
            <span>Sign In with Different Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


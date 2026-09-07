"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OtpCodeInput } from "@/components/ui/otp-code-input";

const features = [
  "หน่วยงาน / ผังองค์กร และบทบาทหน้าที่",
  "ออกแบบ Workflow และ Block",
  "เก็บ Version และ Audit Log ทุกครั้ง",
];

const PIN_LENGTH = 6;

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [loading, user, router]);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpResult, setOtpResult] = useState<"idle" | "success" | "error">("idle");
  const [otpStatus, setOtpStatus] = useState("กรอก PIN 6 หลัก");
  const [resetKey, setResetKey] = useState(0);

  const submitPin = async (value: string) => {
    if (!username.trim()) {
      setOtpStatus("กรุณากรอก Username");
      return;
    }
    if (!/^\d{6}$/.test(value) || submitting) return;
    setSubmitting(true);
    setOtpResult("idle");
    setOtpStatus("กำลังตรวจสอบ...");
    try {
      const result = await api<{ redirectTo: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), pin: value, remember }),
      });
      setOtpResult("success");
      setOtpStatus("เข้าสู่ระบบสำเร็จ");
      await refresh();
      toast.success("เข้าสู่ระบบสำเร็จ");
      window.setTimeout(() => router.push(result.redirectTo), 720);
    } catch (err) {
      setOtpResult("error");
      setOtpStatus(err instanceof ClientApiError ? err.message : "PIN ไม่ถูกต้อง");
      window.setTimeout(() => {
        setOtpResult("idle");
        setOtpStatus("กรอก PIN 6 หลัก");
        setPin("");
        setResetKey((key) => key + 1);
        setSubmitting(false);
      }, 1500);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f2f3]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-10%] h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-[520px] w-[520px] rounded-full bg-primary/12 blur-[90px]" />
        <div className="absolute -right-20 bottom-[-8%] h-[380px] w-[380px] rounded-full bg-sts-navy/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="max-w-xl">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sts-navy text-sm font-bold text-white shadow-lg shadow-sts-navy/20">
              STS
            </div>
            <p className="text-sm font-medium text-sts-deep">STS System & Development</p>
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-sts-navy md:text-5xl">
            ระบบจัดเก็บ Requirement สารบรรณ
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
            บริหารจัดการข้อมูลหน่วยงาน โครงสร้างองค์กร กระบวนการทำงาน และผู้รับผิดชอบ
            อย่างเป็นระบบและถูกต้อง
          </p>

          <ul className="mt-10 space-y-3">
            {features.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base text-slate-600">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[420px] rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-28px_rgba(63,13,18,0.45)] backdrop-blur-xl">
            <div className="mb-6 flex h-1 w-16 overflow-hidden rounded-full">
              <span className="w-1/2 bg-primary" />
              <span className="w-1/2 bg-sts-navy" />
            </div>
            <h2 className="text-2xl font-semibold text-sts-navy">เข้าสู่ระบบ</h2>
            <p className="mt-2 text-base text-slate-500">กรอกชื่อผู้ใช้ และ PIN 6 หลักที่ได้รับจากผู้ดูแลระบบ</p>

            <form
              className="mt-7 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!username.trim()) {
                  setOtpStatus("กรุณากรอก Username");
                  return;
                }
                if (pin.length !== PIN_LENGTH) {
                  setOtpStatus("กรุณากรอก PIN 6 หลัก");
                  return;
                }
                submitPin(pin);
              }}
            >
              <div className="space-y-1.5">
                <label className="text-base text-slate-700" htmlFor="login-username">ชื่อผู้ใช้</label>
                <input
                  id="login-username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                  className="h-12 w-full rounded-xl border border-input bg-white px-3.5 text-base text-sts-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="เช่น admin"
                />
              </div>
              <OtpCodeInput
                disabled={submitting}
                result={otpResult}
                statusText={otpStatus}
                resetKey={resetKey}
                onChange={setPin}
                onComplete={submitPin}
              />
              <label className="flex items-center gap-2 text-base text-slate-600">
                <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(Boolean(checked))} />
                จำการเข้าสู่ระบบ
              </label>
              <Button type="submit" className="h-11 w-full rounded-xl text-base" disabled={submitting || !username.trim() || pin.length !== PIN_LENGTH}>
                {submitting && <Loader2 className="animate-spin" />}
                เข้าสู่ระบบ
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

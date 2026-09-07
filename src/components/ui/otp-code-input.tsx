"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./otp-code-input.css";

const LENGTH = 6;

type OtpResult = "idle" | "success" | "error";

type OtpCodeInputProps = {
  disabled?: boolean;
  result?: OtpResult;
  statusText?: string;
  resetKey?: number;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
};

export function OtpCodeInput({
  disabled = false,
  result = "idle",
  statusText,
  resetKey = 0,
  onChange,
  onComplete,
}: OtpCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [active, setActive] = useState(0);
  const [tapped, setTapped] = useState<number | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const tapTimer = useRef(0);
  const lastComplete = useRef("");

  const value = digits.join("");
  const rootState = result === "success" ? "foc-success" : result === "error" ? "foc-shake" : "";
  const statusState = result === "success" ? "ok" : result === "error" ? "err" : "";
  const message =
    statusText ||
    (result === "success"
      ? "ยืนยันรหัสแล้ว"
      : result === "error"
        ? "PIN ไม่ถูกต้อง"
        : "กรอก PIN 6 หลัก");

  useEffect(() => {
    onChange?.(value);
  }, [value, onChange]);

  useEffect(() => {
    setDigits(Array(LENGTH).fill(""));
    setActive(0);
    lastComplete.current = "";
    inputsRef.current[0]?.focus();
  }, [resetKey]);

  const popBox = (index: number) => {
    setTapped(index);
    window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => setTapped(null), 360);
  };

  const commitDigits = (next: string[], shouldPop?: number) => {
    setDigits(next);
    if (shouldPop !== undefined) popBox(shouldPop);
    const pin = next.join("");
    if (pin.length === LENGTH && /^\d{6}$/.test(pin) && lastComplete.current !== pin) {
      lastComplete.current = pin;
      onComplete?.(pin);
    }
  };

  return (
    <div className={`foc-root ${rootState}`.trim()}>
      <div className="foc-form">
        <div className="foc-boxes" role="group" aria-label="รหัส PIN 6 หลัก">
          <span className="foc-ripple" aria-hidden="true" />
          <span className="foc-ripple foc-ripple--blue" aria-hidden="true" />

          {digits.map((digit, index) => {
            const box = (
              <div
                key={index}
                className={[
                  "foc-box",
                  digit ? "foc-box--filled" : "",
                  active === index ? "foc-box--active" : "",
                  tapped === index ? "foc-box--tap" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ "--foc-i": index } as CSSProperties}
              >
                <span className="foc-caret" aria-hidden="true" />
                <input
                  ref={(element) => {
                    inputsRef.current[index] = element;
                  }}
                  className="foc-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  spellCheck={false}
                  aria-label={`PIN หลักที่ ${index + 1} จาก 6`}
                  value={digit}
                  disabled={disabled || result === "success"}
                  onFocus={() => setActive(index)}
                  onChange={(event) => {
                    const nextDigit = event.target.value.replace(/\D/g, "").slice(-1);
                    const next = [...digits];
                    next[index] = nextDigit;
                    commitDigits(next, nextDigit ? index : undefined);
                    if (nextDigit && index < LENGTH - 1) {
                      inputsRef.current[index + 1]?.focus();
                      inputsRef.current[index + 1]?.select();
                    }
                  }}
                  onKeyDown={(event) => {
                    const key = event.key;
                    if (key === "Backspace") {
                      if (!digits[index] && index > 0) {
                        event.preventDefault();
                        const next = [...digits];
                        next[index - 1] = "";
                        lastComplete.current = "";
                        commitDigits(next);
                        inputsRef.current[index - 1]?.focus();
                      } else if (digits[index]) {
                        const next = [...digits];
                        next[index] = "";
                        lastComplete.current = "";
                        commitDigits(next);
                      }
                    } else if (key === "ArrowLeft" && index > 0) {
                      event.preventDefault();
                      inputsRef.current[index - 1]?.focus();
                    } else if (key === "ArrowRight" && index < LENGTH - 1) {
                      event.preventDefault();
                      inputsRef.current[index + 1]?.focus();
                    } else if (key === "Home") {
                      event.preventDefault();
                      inputsRef.current[0]?.focus();
                    } else if (key === "End") {
                      event.preventDefault();
                      inputsRef.current[LENGTH - 1]?.focus();
                    }
                  }}
                  onPaste={(event) => {
                    event.preventDefault();
                    const pasted = event.clipboardData
                      .getData("text")
                      .replace(/\D/g, "")
                      .slice(0, LENGTH);
                    if (!pasted) return;
                    const next = Array(LENGTH).fill("");
                    pasted.split("").forEach((char, charIndex) => {
                      next[charIndex] = char;
                      popBox(charIndex);
                    });
                    commitDigits(next);
                    inputsRef.current[Math.min(pasted.length, LENGTH) - 1]?.focus();
                  }}
                />
                <svg className="foc-check" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.6l4.3 4.3L19 6.7" />
                </svg>
              </div>
            );

            if (index !== 3) return box;
            return (
              <span key="group-3" className="foc-group">
                <span className="foc-divider" aria-hidden="true" />
                {box}
              </span>
            );
          })}
        </div>

        <div className={`foc-status${statusState ? ` foc-status--${statusState}` : ""}`} role="status" aria-live="polite">
          <span className="foc-status-dot" aria-hidden="true" />
          <span className="foc-status-text">{message}</span>
        </div>
      </div>
    </div>
  );
}

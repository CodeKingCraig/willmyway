"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  priority: string;
  lettersIntent: string;
  dependants: string;
  completionTiming: string;
  supportNeed: string;
};

type QuestionCardProps = {
  step: number;
  title: string;
  subtitle?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

const initialState: FormState = {
  priority: "",
  lettersIntent: "",
  dependants: "",
  completionTiming: "",
  supportNeed: "",
};

function QuestionCard({
  step,
  title,
  subtitle,
  value,
  options,
  onChange,
}: QuestionCardProps) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)]">
          {step}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h3>

          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
          ) : null}

          <div className="mt-4 grid gap-3">
            {options.map((option) => {
              const selected = value === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  className={`w-full rounded-2xl px-4 py-4 text-left text-sm font-medium transition ${
                    selected
                      ? "bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)]"
                      : "bg-[#f8fafc] text-slate-700 ring-1 ring-slate-200 hover:bg-white"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function isSuccessResponse(
  payload: unknown
): payload is { ok: true; redirectTo: string } {
  if (!payload || typeof payload !== "object") return false;

  const candidate = payload as { ok?: unknown; redirectTo?: unknown };
  return candidate.ok === true && typeof candidate.redirectTo === "string";
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;

  const candidate = payload as { error?: unknown; message?: unknown };
  if (typeof candidate.error === "string") return candidate.error;
  if (typeof candidate.message === "string") return candidate.message;

  return fallback;
}

export default function OnboardingInsightForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedCount = useMemo(() => {
    return Object.values(form).filter(Boolean).length;
  }, [form]);

  const isComplete = completedCount === 5;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isComplete || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setError(getErrorMessage(payload, "Failed to save onboarding"));
        setSubmitting(false);
        return;
      }

      if (!isSuccessResponse(payload)) {
        setError("Unexpected response from server");
        setSubmitting(false);
        return;
      }

      router.push(payload.redirectTo);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <QuestionCard
        step={1}
        title="What matters most to you right now?"
        subtitle="Choose the outcome that feels most important at this stage."
        value={form.priority}
        options={[
          "Protecting my family",
          "Avoiding conflict",
          "Leaving clarity",
          "Building a legacy",
          "Peace of mind",
        ]}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            priority: value,
          }))
        }
      />

      <QuestionCard
        step={2}
        title="Would you like to leave personal letters or messages for loved ones?"
        subtitle="This helps us understand whether legacy messaging tools may matter to you."
        value={form.lettersIntent}
        options={[
          "Yes, definitely",
          "Maybe later",
          "Not right now",
        ]}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            lettersIntent: value,
          }))
        }
      />

      <QuestionCard
        step={3}
        title="Do you have children or dependants you want to plan for?"
        subtitle="This can shape how we prioritise guidance around guardianship and family planning."
        value={form.dependants}
        options={[
          "Yes",
          "No",
          "Prefer not to say",
        ]}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            dependants: value,
          }))
        }
      />

      <QuestionCard
        step={4}
        title="How soon would you like to complete your will?"
        subtitle="Choose what best reflects your current timing."
        value={form.completionTiming}
        options={[
          "Today",
          "This week",
          "This month",
          "I’m just exploring",
        ]}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            completionTiming: value,
          }))
        }
      />

      <QuestionCard
        step={5}
        title="What would help you most right now?"
        subtitle="This lets us understand the kind of support you value most."
        value={form.supportNeed}
        options={[
          "Guidance",
          "Simplicity",
          "Legal confidence",
          "Secure storage",
          "Family planning tools",
        ]}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            supportNeed: value,
          }))
        }
      />

      <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Progress
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              {completedCount} of 5 questions answered.
            </div>
          </div>

          <div className="w-full max-w-xs">
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7b95bb] to-[#6d87ad] transition-all"
                style={{ width: `${(completedCount / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!isComplete || submitting}
            className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              isComplete && !submitting
                ? "bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
            }`}
          >
            {submitting ? "Saving your answers..." : "Continue to Step 1"}
          </button>

          <div className="inline-flex items-center rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            You’ll only need to complete this once.
          </div>
        </div>
      </div>
    </form>
  );
}
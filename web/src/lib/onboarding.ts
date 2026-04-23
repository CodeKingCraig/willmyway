import { prisma } from "@/lib/prisma";

export type OnboardingAnswers = {
  priority: string;
  lettersIntent: string;
  dependants: string;
  completionTiming: string;
  supportNeed: string;
};

export type OnboardingState = {
  completed: boolean;
  completedAt: Date | null;
  answers: OnboardingAnswers | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function parseOnboardingAnswers(value: unknown): OnboardingAnswers | null {
  if (!isRecord(value)) return null;

  const priority = value.priority;
  const lettersIntent = value.lettersIntent;
  const dependants = value.dependants;
  const completionTiming = value.completionTiming;
  const supportNeed = value.supportNeed;

  if (!isString(priority)) return null;
  if (!isString(lettersIntent)) return null;
  if (!isString(dependants)) return null;
  if (!isString(completionTiming)) return null;
  if (!isString(supportNeed)) return null;

  return {
    priority,
    lettersIntent,
    dependants,
    completionTiming,
    supportNeed,
  };
}

export async function getOnboardingStateByUserId(
  userId: string
): Promise<OnboardingState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingCompleted: true,
      onboardingCompletedAt: true,
      onboardingAnswers: true,
    },
  });

  if (!user) {
    return {
      completed: false,
      completedAt: null,
      answers: null,
    };
  }

  return {
    completed: user.onboardingCompleted,
    completedAt: user.onboardingCompletedAt,
    answers: parseOnboardingAnswers(user.onboardingAnswers),
  };
}

export function shouldShowOnboarding(input: {
  onboardingCompleted: boolean;
}) {
  return input.onboardingCompleted !== true;
}

export async function requireCompletedOnboarding(userId: string) {
  const onboarding = await getOnboardingStateByUserId(userId);

  return {
    completed: onboarding.completed,
    answers: onboarding.answers,
    completedAt: onboarding.completedAt,
  };
}

export function getOnboardingPersonalisation(input: OnboardingAnswers | null) {
  if (!input) {
    return {
      dashboardFocus: "Clarity and peace of mind",
      legacyPrompt: "Capture messages and guidance for loved ones",
      familyPrompt: "Plan clearly for the people who matter most",
      carePrompt: "Add ongoing support and secure peace of mind",
    };
  }

  const dashboardFocusMap: Record<string, string> = {
    "Protecting my family": "Protection and planning for loved ones",
    "Avoiding conflict": "Reducing uncertainty and future conflict",
    "Leaving clarity": "Creating clarity and confidence",
    "Building a legacy": "Preserving legacy and meaning",
    "Peace of mind": "Calm, confidence, and peace of mind",
  };

  const legacyPrompt =
    input.lettersIntent === "Yes, definitely"
      ? "You may value personal letters and legacy messages"
      : input.lettersIntent === "Maybe later"
      ? "Legacy letters may still be useful later in your journey"
      : "You can always add personal legacy messages later";

  const familyPrompt =
    input.dependants === "Yes"
      ? "Family planning tools may be especially important for you"
      : input.dependants === "Prefer not to say"
      ? "You can explore family planning tools whenever you’re ready"
      : "Clear planning tools remain available whenever needed";

  const carePrompt =
    input.supportNeed === "Guidance"
      ? "Extra guided support may help you finish with confidence"
      : input.supportNeed === "Simplicity"
      ? "A simpler guided path may suit you best"
      : input.supportNeed === "Legal confidence"
      ? "Confidence-focused support may matter most to you"
      : input.supportNeed === "Secure storage"
      ? "Secure storage features may be especially valuable to you"
      : "Family support tools may matter most in your planning";

  return {
    dashboardFocus:
      dashboardFocusMap[input.priority] ?? "Clarity and peace of mind",
    legacyPrompt,
    familyPrompt,
    carePrompt,
  };
}

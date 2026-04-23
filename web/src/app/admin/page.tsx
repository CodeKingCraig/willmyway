import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

type AdminPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

const BASE_PLAN_OPTIONS = [
  "ESSENTIAL",
  "LEGACY",
  "FAMILY_VAULT",
  "FULL",
] as const;

const CARE_STATUS_OPTIONS = [
  "NOT_ACTIVE",
  "ACTIVE",
  "CANCELLED",
  "EXPIRED",
] as const;

type BasePlan = (typeof BASE_PLAN_OPTIONS)[number];
type CareStatus = (typeof CARE_STATUS_OPTIONS)[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getBasePlanBadgeClass(plan: BasePlan) {
  switch (plan) {
    case "LEGACY":
      return "bg-[#f3e8d2] text-slate-800 ring-[#ead9b8]";
    case "FAMILY_VAULT":
      return "bg-[#e8f4ee] text-emerald-800 ring-[#cfe7d9]";
    case "FULL":
      return "bg-slate-900 text-white ring-slate-700";
    case "ESSENTIAL":
    default:
      return "bg-white text-slate-800 ring-slate-200";
  }
}

function getBasePlanLabel(plan: BasePlan) {
  switch (plan) {
    case "FAMILY_VAULT":
      return "Family Vault";
    case "FULL":
      return "Full Access";
    case "LEGACY":
      return "Legacy";
    case "ESSENTIAL":
    default:
      return "Essential";
  }
}

function getCareStatusBadgeClass(status: CareStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-[#eef4ff] text-blue-800 ring-[#d8e4fb]";
    case "CANCELLED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "EXPIRED":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "NOT_ACTIVE":
    default:
      return "bg-white text-slate-800 ring-slate-200";
  }
}

function getCareStatusLabel(status: CareStatus) {
  switch (status) {
    case "ACTIVE":
      return "Care Active";
    case "CANCELLED":
      return "Care Cancelled";
    case "EXPIRED":
      return "Care Expired";
    case "NOT_ACTIVE":
    default:
      return "No Care";
  }
}

function getProgressLabel(step: number, status: string) {
  if (status === "LOCKED") return "Completed";
  return `Step ${step} / 6`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  if (!sessionUser.emailVerified) {
    redirect("/verify-email?email=" + encodeURIComponent(sessionUser.email));
  }

  if (sessionUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();

  async function updateAccessAction(formData: FormData) {
    "use server";

    const actingUser = await getSessionUser();

    if (!actingUser || actingUser.role !== "ADMIN") {
      redirect("/login");
    }

    const userId = formData.get("userId")?.toString().trim();
    const basePlan = formData.get("basePlan")?.toString().trim() as
      | BasePlan
      | undefined;
    const careStatus = formData.get("careStatus")?.toString().trim() as
      | CareStatus
      | undefined;
    const currentQuery = formData.get("q")?.toString().trim();

    if (
      !userId ||
      !basePlan ||
      !careStatus ||
      !BASE_PLAN_OPTIONS.includes(basePlan) ||
      !CARE_STATUS_OPTIONS.includes(careStatus)
    ) {
      throw new Error("Invalid access update request.");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw new Error("Target user not found.");
    }

    if (targetUser.role === "ADMIN") {
      throw new Error("Admin accounts cannot be edited from this screen.");
    }

    const careActive = careStatus === "ACTIVE";
    const now = new Date();

    await prisma.user.update({
      where: { id: userId },
      data: {
        basePlan,
        careActive,
        careStatus,
        careStartedAt: careStatus === "ACTIVE" ? now : null,
        careEndsAt:
          careStatus === "CANCELLED" || careStatus === "EXPIRED" ? now : null,
      },
    });

    revalidatePath("/admin");

    if (currentQuery) {
      redirect(`/admin?q=${encodeURIComponent(currentQuery)}`);
    }

    redirect("/admin");
  }

  async function logoutAction() {
    "use server";

    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    redirect("/login");
  }

  const customers = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            {
              fullName: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      emailVerified: true,
      onboardingCompleted: true,
      onboardingCompletedAt: true,
      createdAt: true,
      basePlan: true,
      careActive: true,
      careStartedAt: true,
      careEndsAt: true,
      careStatus: true,
      role: true,
      draft: {
        select: {
          step: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  });

  const totalUsers = customers.length;
  const freeUsers = customers.filter(
    (customer) => customer.basePlan === "ESSENTIAL"
  ).length;
  const premiumUsers = customers.filter(
    (customer) => customer.basePlan !== "ESSENTIAL"
  ).length;
  const careUsers = customers.filter(
    (customer) => customer.careActive && customer.careStatus === "ACTIVE"
  ).length;
  const verifiedUsers = customers.filter(
    (customer) => customer.emailVerified
  ).length;
  const onboardingCompletedUsers = customers.filter(
    (customer) => customer.onboardingCompleted
  ).length;
  const willsStartedUsers = customers.filter((customer) => customer.draft).length;
  const willsLockedUsers = customers.filter(
    (customer) => customer.draft?.status === "LOCKED"
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(123,149,187,0.14),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(232,220,196,0.30),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-[34px] border border-white/70 bg-white/60 p-8 shadow-[0_20px_60px_rgba(148,163,184,0.10)] backdrop-blur-md">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/80 ring-1 ring-white/80 shadow-sm backdrop-blur">
                  <img
                    src="/luma.png"
                    alt="luma"
                    className="h-8 w-8 object-contain"
                  />
                </div>

                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                    Admin
                  </div>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                    KeepSave Control Room
                  </h1>
                  <div className="mt-2 text-sm text-slate-600">
                    Signed in as{" "}
                    <span className="font-semibold text-slate-800">
                      {sessionUser.email}
                    </span>
                  </div>
                  <div className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    Manage customers, review lifecycle status, and update base
                    plan plus Care add-on access from one place.
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl bg-white/75 px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-white/80 shadow-sm backdrop-blur transition hover:bg-white"
                >
                  Customer Dashboard
                </Link>

                <Link
                  href="/checkout?plan=legacy"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                >
                  View Checkout
                </Link>

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-white/75 px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-white/80 shadow-sm backdrop-blur transition hover:bg-white"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-8">
              <div className="rounded-2xl bg-white/78 p-4 ring-1 ring-white/80">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Total users
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {totalUsers}
                </div>
              </div>

              <div className="rounded-2xl bg-white/78 p-4 ring-1 ring-white/80">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Free users
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {freeUsers}
                </div>
              </div>

              <div className="rounded-2xl bg-white/78 p-4 ring-1 ring-white/80">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Premium users
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {premiumUsers}
                </div>
              </div>

              <div className="rounded-2xl bg-[#eef4ff] p-4 ring-1 ring-[#d8e4fb]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Care active
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {careUsers}
                </div>
              </div>

              <div className="rounded-2xl bg-white/78 p-4 ring-1 ring-white/80">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Verified users
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {verifiedUsers}
                </div>
              </div>

              <div className="rounded-2xl bg-white/78 p-4 ring-1 ring-white/80">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Onboarded
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {onboardingCompletedUsers}
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8fbff] p-4 ring-1 ring-[#e2ebf6]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Wills started
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {willsStartedUsers}
                </div>
              </div>

              <div className="rounded-2xl bg-[#f4fbf7] p-4 ring-1 ring-[#dfeee6]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Wills locked
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {willsLockedUsers}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[30px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_50px_rgba(148,163,184,0.12)] backdrop-blur-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                  Customer management
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Customers
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Search by full name or email, review verification and progress,
                  and update a customer’s base plan plus Care add-on directly from
                  the table.
                </p>
              </div>

              <form className="flex w-full max-w-xl items-center gap-3" action="/admin">
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by name or email"
                  className="h-12 w-full rounded-2xl border border-white/80 bg-white/85 px-4 text-sm text-slate-800 outline-none ring-1 ring-white/80 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                >
                  Search
                </button>
                <Link
                  href="/admin"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/75 px-5 text-sm font-semibold text-slate-700 ring-1 ring-white/80 shadow-sm transition hover:bg-white"
                >
                  Reset
                </Link>
              </form>
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-white/80 bg-white/80 ring-1 ring-white/80">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#f8fbff]">
                    <tr className="text-left">
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Customer
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Joined
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Verified
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Onboarding
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Will progress
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Base plan
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Care
                      </th>
                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Update access
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-sm text-slate-500"
                        >
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      customers.map((customer) => {
                        const willStep = customer.draft?.step ?? 0;
                        const willStatus = customer.draft?.status ?? "NOT_STARTED";
                        const willUpdatedAt = customer.draft?.updatedAt ?? null;
                        const isInternalAdmin = customer.role === "ADMIN";

                        return (
                          <tr
                            key={customer.id}
                            className="border-t border-slate-100 align-top"
                          >
                            <td className="px-4 py-4">
                              <div className="font-semibold text-slate-900">
                                {customer.fullName?.trim() || "No name provided"}
                              </div>
                              <div className="mt-1 text-sm text-slate-600">
                                {customer.email}
                              </div>
                              <div className="mt-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                    customer.role === "ADMIN"
                                      ? "bg-slate-900 text-white ring-slate-700"
                                      : "bg-slate-100 text-slate-700 ring-slate-200"
                                  }`}
                                >
                                  {customer.role}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {formatDate(customer.createdAt)}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                  customer.emailVerified
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                    : "bg-amber-50 text-amber-700 ring-amber-200"
                                }`}
                              >
                                {customer.emailVerified ? "Verified" : "Pending"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                <span
                                  className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                    customer.onboardingCompleted
                                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                      : "bg-slate-100 text-slate-700 ring-slate-200"
                                  }`}
                                >
                                  {customer.onboardingCompleted
                                    ? "Completed"
                                    : "Not completed"}
                                </span>

                                {customer.onboardingCompletedAt ? (
                                  <div className="text-xs text-slate-500">
                                    {formatDate(customer.onboardingCompletedAt)}
                                  </div>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                <span
                                  className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                    willStatus === "LOCKED"
                                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                      : willStatus === "DRAFT"
                                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                                      : "bg-slate-100 text-slate-700 ring-slate-200"
                                  }`}
                                >
                                  {willStatus === "NOT_STARTED"
                                    ? "Not started"
                                    : willStatus}
                                </span>

                                <div className="text-sm text-slate-700">
                                  {willStatus === "NOT_STARTED"
                                    ? "No draft yet"
                                    : getProgressLabel(willStep, willStatus)}
                                </div>

                                {willUpdatedAt ? (
                                  <div className="text-xs text-slate-500">
                                    Updated {formatDate(willUpdatedAt)}
                                  </div>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                <span
                                  className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getBasePlanBadgeClass(
                                    customer.basePlan
                                  )}`}
                                >
                                  {getBasePlanLabel(customer.basePlan)}
                                </span>
                                <div className="text-xs text-slate-500">
                                  Stored as {customer.basePlan}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                <span
                                  className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getCareStatusBadgeClass(
                                    customer.careStatus
                                  )}`}
                                >
                                  {getCareStatusLabel(customer.careStatus)}
                                </span>

                                <div className="text-xs text-slate-500">
                                  careActive: {customer.careActive ? "true" : "false"}
                                </div>

                                {customer.careStartedAt ? (
                                  <div className="text-xs text-slate-500">
                                    Started {formatDate(customer.careStartedAt)}
                                  </div>
                                ) : null}

                                {customer.careEndsAt ? (
                                  <div className="text-xs text-slate-500">
                                    Ended {formatDate(customer.careEndsAt)}
                                  </div>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              {isInternalAdmin ? (
                                <div className="space-y-3">
                                  <div className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                                    Internal account
                                  </div>
                                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                                    Admin access records are protected from editing in this screen.
                                  </div>
                                </div>
                              ) : (
                                <form action={updateAccessAction} className="space-y-3">
                                  <input type="hidden" name="userId" value={customer.id} />
                                  <input type="hidden" name="q" value={query} />

                                  <select
                                    name="basePlan"
                                    defaultValue={customer.basePlan}
                                    className="h-11 w-full min-w-[180px] rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
                                  >
                                    {BASE_PLAN_OPTIONS.map((plan) => (
                                      <option key={plan} value={plan}>
                                        {getBasePlanLabel(plan)}
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    name="careStatus"
                                    defaultValue={customer.careStatus}
                                    className="h-11 w-full min-w-[180px] rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#7b95bb] focus:ring-4 focus:ring-[#7b95bb]/15"
                                  >
                                    {CARE_STATUS_OPTIONS.map((status) => (
                                      <option key={status} value={status}>
                                        {getCareStatusLabel(status)}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="submit"
                                    className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#7b95bb] to-[#6d87ad] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(123,149,187,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(123,149,187,0.28)]"
                                  >
                                    Save Access
                                  </button>
                                </form>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#fffaf1] p-4 ring-1 ring-[#f4ead2]">
              <div className="text-sm font-semibold text-slate-900">
                Admin note
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                Access is now split into base plan plus Care add-on. This aligns
                with the new product model, replacing the old single-plan system
                used in the prior dashboard and admin pages.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

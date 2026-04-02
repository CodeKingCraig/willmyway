"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type AppHeaderProps = {
  myWillHref: string;
};

export default function AppHeader({ myWillHref }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/legacy") return pathname.startsWith("/legacy");
    if (href.startsWith("/will")) return pathname.startsWith("/will");
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    [
      "relative pb-2 text-sm font-medium transition",
      isActive(href)
        ? "text-slate-900"
        : "text-slate-600 hover:text-slate-900",
    ].join(" ");

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/dashboard"
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          WillMyWay
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
            {isActive("/dashboard") ? (
              <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-[#7b95bb]" />
            ) : null}
          </Link>

          <Link href={myWillHref} className={linkClass("/will")}>
            My Will
            {isActive("/will") ? (
              <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-[#7b95bb]" />
            ) : null}
          </Link>

          <Link href="/legacy" className={linkClass("/legacy")}>
            Legacy
            {isActive("/legacy") ? (
              <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-[#7b95bb]" />
            ) : null}
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
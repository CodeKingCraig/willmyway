import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.emailVerified) {
    redirect(`/login?email=${encodeURIComponent(user.email)}&verified=expired`);
  }

  return <>{children}</>;
}

import AppHeader from "@/components/AppHeader";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader myWillHref="/dashboard" />
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </>
  );
}
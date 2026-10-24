// This layout ensures the dashboard page is always rendered dynamically
// Required for pages using useSearchParams() in App Router
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

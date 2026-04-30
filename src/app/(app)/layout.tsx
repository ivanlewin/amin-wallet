import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { getCurrentUserRecord } from "@/lib/auth/current-user";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUserRecord();

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          email: user.email,
          firstName: user.firstName,
        }}
      />
      <SidebarInset className="bg-muted/20">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <SidebarTrigger />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Amin Wallet</p>
          </div>
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

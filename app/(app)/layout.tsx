export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto min-h-screen max-w-7xl px-6 py-6 sm:px-10">{children}</div>
    </div>
  );
}


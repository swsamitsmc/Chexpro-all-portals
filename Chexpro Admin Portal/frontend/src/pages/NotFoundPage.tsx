export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl mt-4">Page not found</p>
      <a href="/dashboard" className="mt-6 text-primary hover:underline">Return to Dashboard</a>
    </div>
  );
}
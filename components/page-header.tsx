"use client";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

export function PageHeader({ title }: { title?: string }) {
  return (
    <header className="mb-6 flex items-center justify-between border-b border-border/60 bg-card/50 px-4 pb-4 pt-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">
          {getGreeting()}!
        </p>
        {title && (
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        )}
      </div>
    </header>
  );
}

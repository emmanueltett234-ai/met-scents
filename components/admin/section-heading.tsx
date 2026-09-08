export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="kicker">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-xl text-ink">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="min-w-0 shrink-0">{action}</div>}
    </div>
  );
}

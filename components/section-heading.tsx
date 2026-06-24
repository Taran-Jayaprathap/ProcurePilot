import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  className
}: SectionHeadingProps) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <Badge variant="muted">{eyebrow}</Badge>
      <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
        {title}
      </h2>
      <p className="mt-5 text-lg leading-8 text-slate-400">{description}</p>
    </div>
  );
}

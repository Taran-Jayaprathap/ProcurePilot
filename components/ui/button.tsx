import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-slate-950 shadow-[0_0_40px_rgba(255,255,255,0.18)] hover:bg-slate-200",
  secondary:
    "border border-white/12 bg-white/[0.07] text-white shadow-inner shadow-white/5 hover:bg-white/[0.12]",
  ghost: "text-slate-300 hover:bg-white/[0.08] hover:text-white",
  danger:
    "border border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base"
};

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkButtonProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:pointer-events-none disabled:opacity-50";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(baseClass, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(baseClass, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

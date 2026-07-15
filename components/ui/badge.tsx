import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
};

const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-slate-900 text-white",
  secondary: "bg-slate-100 text-slate-700",
  outline: "border border-slate-200 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", badgeVariants[variant], className)} {...props} />;
}
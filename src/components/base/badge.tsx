import type * as React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BadgeColor =
  | "gray"
  | "blue"
  | "amber"
  | "red"
  | "green"
  | "purple";

const colorStyles: Record<BadgeColor, string> = {
  gray: "bg-muted text-foreground border-transparent",
  blue: "bg-blue-50 text-blue-700 border-transparent",
  amber: "bg-amber-50 text-amber-700 border-transparent",
  red: "bg-red-50 text-red-700 border-transparent",
  green: "bg-green-50 text-green-700 border-transparent",
  purple: "bg-purple-50 text-purple-700 border-transparent",
};

interface BadgeProps
  extends Omit<React.ComponentProps<typeof ShadcnBadge>, "variant"> {
  color?: BadgeColor;
}

function Badge({ color = "gray", className, ...props }: BadgeProps) {
  return (
    <ShadcnBadge
      variant="outline"
      className={cn("font-medium", colorStyles[color], className)}
      {...props}
    />
  );
}

export { Badge };

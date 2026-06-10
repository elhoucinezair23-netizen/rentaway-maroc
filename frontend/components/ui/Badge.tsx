import { clsx } from "clsx";
import { ShieldCheck, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

type BadgeVariant =
  | "verified"
  | "pending"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "category";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}

const variantConfig: Record<BadgeVariant, { classes: string; Icon?: React.ElementType }> = {
  verified:  { classes: "bg-primary-50 text-primary-700 border border-primary-200", Icon: ShieldCheck },
  pending:   { classes: "bg-accent-100 text-accent-700", Icon: Clock },
  success:   { classes: "bg-green-100 text-green-700",  Icon: CheckCircle },
  danger:    { classes: "bg-primary-100 text-primary-700", Icon: XCircle },
  warning:   { classes: "bg-accent-100 text-accent-700", Icon: AlertTriangle },
  info:      { classes: "bg-secondary-100 text-secondary-700" },
  category:  { classes: "bg-primary-100 text-primary-700" },
};

export function Badge({ variant = "info", children, icon = false, className }: BadgeProps) {
  const config = variantConfig[variant];
  const Icon = config.Icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full",
        config.classes,
        className
      )}
    >
      {icon && Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

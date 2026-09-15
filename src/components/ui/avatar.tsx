import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { getMonikerInitials } from "@/lib/utils/pseudonym";
import { getAvatarPreset } from "@/lib/utils/avatars";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  moniker?: string;
  avatarId?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Avatar({
  moniker = "Anonymous",
  avatarId,
  color,
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const preset = avatarId ? getAvatarPreset(avatarId) : null;
  const finalColor = color || preset?.color || "#C15438";
  const finalBgColor = preset?.bgColor || `${finalColor}18`;
  const initials = getMonikerInitials(moniker);

  const sizeClasses = {
    sm: "w-7 h-7 text-[11px] font-semibold rounded-md",
    md: "w-9 h-9 text-xs font-bold rounded-lg",
    lg: "w-11 h-11 text-sm font-bold rounded-lg",
    xl: "w-14 h-14 text-base font-bold rounded-xl",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center shrink-0 select-none border border-black/5 tracking-wider font-mono transition-transform",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: finalBgColor,
        color: finalColor,
      }}
      title={moniker}
      {...props}
    >
      <span>{initials}</span>
    </div>
  );
}

import { ReactNode } from "react";

interface SectionHeaderProps {
  children: ReactNode;
  icon?: ReactNode;
}

export default function SectionHeader({ children, icon }: SectionHeaderProps) {
  return (
    <div className="section-header">
      {icon && <span className="flex-shrink-0" style={{ color: "var(--accent-violet)" }}>{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

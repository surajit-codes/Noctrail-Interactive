import { ReactNode, isValidElement } from "react";

interface SectionHeaderProps {
  children?: ReactNode;
  title?: string;
  icon?: any;
}

export default function SectionHeader({ children, title, icon }: SectionHeaderProps) {
  // Support both JSX elements (e.g. icon={<Bell size={14} />})
  // and component references (e.g. icon={Bell})
  const renderIcon = () => {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    const Icon = icon;
    return <Icon size={18} />;
  };

  return (
    <div className="flex items-center gap-2 mb-4 text-[var(--accent-violet)] text-sm font-bold uppercase tracking-wider">
      {renderIcon()}
      <span>{title || children}</span>
    </div>
  );
}

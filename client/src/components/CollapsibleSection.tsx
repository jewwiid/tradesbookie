import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function CollapsibleSection({
  title,
  subtitle,
  children,
  defaultOpen = false,
  className = "",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`${className}`}>
      <div className="text-center mb-6">
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-2xl lg:text-3xl font-bold text-gray-900 hover:bg-transparent p-0 h-auto"
        >
          {isOpen ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <ChevronRight className="w-6 h-6" />
          )}
          {title}
        </Button>
        {subtitle && !isOpen && (
          <p className="text-lg text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>

      {isOpen && (
        <div className="transition-all duration-300 ease-in-out">
          {subtitle && (
            <div className="text-center mb-8">
              <p className="text-xl text-gray-600">{subtitle}</p>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
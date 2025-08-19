import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ServiceCardProps {
  title: string;
  description: string;
  price: number;
  icon?: string;
  popular?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ServiceCard({
  title,
  description,
  price,
  icon,
  popular = false,
  selected = false,
  onClick,
  className = ""
}: ServiceCardProps) {
  return (
    <Card
      className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
        selected 
          ? 'border-indigo-500 bg-indigo-50 shadow-md' 
          : 'border-gray-200 hover:border-indigo-300'
      } ${className}`}
      onClick={onClick}
    >
      {popular && (
        <Badge className="absolute -top-2 right-4 bg-indigo-500 text-white">
          Popular
        </Badge>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">€{price}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Button } from '@/components/ui/button';
import { TV_SIZES } from '@/lib/constants';
import { Tv } from 'lucide-react';

interface TVSizeSelectorProps {
  selectedSize: string;
  onSizeSelect: (size: string) => void;
}

export default function TVSizeSelector({ selectedSize, onSizeSelect }: TVSizeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {TV_SIZES.map((size) => (
        <Button
          key={size.value}
          variant={selectedSize === size.value ? "default" : "outline"}
          className="h-auto p-6 flex flex-col items-center space-y-3"
          onClick={() => onSizeSelect(size.value)}
        >
          <Tv className="h-8 w-8" />
          <div className="text-center">
            <div className="text-lg font-semibold">{size.label}</div>
            <div className="text-sm text-muted-foreground">{size.category}</div>
          </div>
        </Button>
      ))}
    </div>
  );
}

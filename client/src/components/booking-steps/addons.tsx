import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { useQuery } from '@tanstack/react-query';
import { ADDONS, formatPrice } from '@/lib/constants';

interface AddonsProps {
  onNext: () => void;
  onBack: () => void;
}

export default function Addons({ onNext, onBack }: AddonsProps) {
  const { data, addAddon, removeAddon } = useBookingStore();

  const { data: addonsData, isLoading } = useQuery({
    queryKey: ['/api/addons'],
  });

  const handleAddonToggle = (addonKey: string, checked: boolean) => {
    const addon = Object.values(ADDONS).find(a => a.key === addonKey);
    if (!addon) return;

    if (checked) {
      addAddon({
        key: addon.key,
        name: addon.name,
        price: addon.price
      });
    } else {
      removeAddon(addonKey);
    }
  };

  const isAddonSelected = (addonKey: string) => {
    return data.addons.some(addon => addon.key === addonKey);
  };

  if (isLoading) {
    return (
      <Card className="typeform-card">
        <CardContent className="text-center">
          <div className="animate-pulse">Loading add-ons...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="typeform-card">
      <CardContent>
        <div className="text-center mb-8">
          <div className="w-20 h-20 typeform-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Add-on Services</h2>
          <p className="text-lg text-gray-600">Enhance your installation with these optional services</p>
        </div>

        <div className="space-y-4 mb-8">
          {Object.values(ADDONS).map((addon) => (
            <label
              key={addon.key}
              className={`flex items-center p-4 border-2 rounded-2xl transition-all duration-300 cursor-pointer ${
                isAddonSelected(addon.key)
                  ? 'border-primary bg-gradient-to-br from-blue-50 to-indigo-50'
                  : 'border-gray-200 hover:border-primary hover:bg-blue-50'
              }`}
            >
              <Checkbox
                checked={isAddonSelected(addon.key)}
                onCheckedChange={(checked) => handleAddonToggle(addon.key, checked as boolean)}
                className="mr-4"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{addon.name}</h3>
                <p className="text-sm text-gray-600">{addon.description}</p>
              </div>
              <div className="text-lg font-semibold text-gray-900">+{formatPrice(addon.price)}</div>
            </label>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} className="btn-primary">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

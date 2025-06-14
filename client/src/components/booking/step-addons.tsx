import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { ADDON_SERVICES } from '@/lib/constants';

interface StepAddonsProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepAddons({ onNext, onBack }: StepAddonsProps) {
  const { state, dispatch } = useBooking();

  const handleAddonToggle = (addonKey: string, checked: boolean) => {
    const addon = ADDON_SERVICES[addonKey as keyof typeof ADDON_SERVICES];
    
    if (checked) {
      dispatch({
        type: 'ADD_ADDON',
        addon: {
          key: addonKey,
          name: addon.name,
          price: addon.price,
        },
      });
    } else {
      dispatch({ type: 'REMOVE_ADDON', addonKey });
    }
  };

  const isAddonSelected = (addonKey: string) => {
    return state.addons.some(addon => addon.key === addonKey);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Add-on Services</h2>
          <p className="text-lg text-gray-600">
            Enhance your installation with these optional services
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {Object.entries(ADDON_SERVICES).map(([key, addon]) => (
            <label
              key={key}
              className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                isAddonSelected(key)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <Checkbox
                checked={isAddonSelected(key)}
                onCheckedChange={(checked) => handleAddonToggle(key, checked as boolean)}
                className="mr-4"
              />
              <div className="flex items-center flex-1">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-xl">{addon.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{addon.name}</h3>
                  <p className="text-sm text-gray-600">{addon.description}</p>
                </div>
                <div className="text-lg font-semibold text-gray-900">+€{addon.price}</div>
              </div>
            </label>
          ))}
        </div>

        {state.addons.length > 0 && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">Selected Add-ons:</h3>
            <div className="space-y-1">
              {state.addons.map((addon) => (
                <div key={addon.key} className="flex justify-between text-sm">
                  <span>{addon.name}</span>
                  <span>€{addon.price}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-blue-200 mt-2 pt-2">
              <div className="flex justify-between font-semibold">
                <span>Add-ons Total:</span>
                <span>€{state.addonTotal}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button 
            onClick={onNext}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

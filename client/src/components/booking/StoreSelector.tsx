import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface Retailer {
  code: string;
  name: string;
  fullName: string;
  color: string;
  storeLocations: Record<string, string>;
}

interface StoreInfo {
  retailerCode: string;
  storeCode: string;
  storeName: string;
}

interface StoreSelectorProps {
  onStoreSelect: (storeInfo: StoreInfo) => void;
  referralCode?: string;
}

export default function StoreSelector({ onStoreSelect, referralCode }: StoreSelectorProps) {
  const [selectedRetailer, setSelectedRetailer] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [autoDetectedStore, setAutoDetectedStore] = useState<StoreInfo | null>(null);

  // Fetch all supported retailers
  const { data: retailers } = useQuery<Retailer[]>({
    queryKey: ['/api/retail-partner/retailers'],
  });

  // Auto-detect store from referral code
  useEffect(() => {
    if (referralCode && referralCode.length >= 6) {
      const detectStore = async () => {
        try {
          const response = await fetch('/api/retail-partner/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: referralCode, type: 'referral' })
          });
          
          const result = await response.json();
          
          if (result.success && result.detected && result.retailerInfo) {
            const storeInfo: StoreInfo = {
              retailerCode: result.retailerCode,
              storeCode: result.storeCode,
              storeName: getStoreName(result.retailerCode, result.storeCode, result.retailerInfo)
            };
            
            setAutoDetectedStore(storeInfo);
            setSelectedRetailer(result.retailerCode);
            setSelectedStore(result.storeCode);
            onStoreSelect(storeInfo);
          } else {
            setAutoDetectedStore(null);
          }
        } catch (error) {
          console.error('Error detecting store from referral code:', error);
        }
      };
      
      detectStore();
    } else {
      setAutoDetectedStore(null);
    }
  }, [referralCode, onStoreSelect]);

  const getStoreName = (retailerCode: string, storeCode: string, retailerInfo?: Retailer): string => {
    const retailer = retailerInfo || retailers?.find(r => r.code === retailerCode);
    if (!retailer) return `${retailerCode} ${storeCode}`;
    
    const storeName = retailer.storeLocations[storeCode] || storeCode;
    return `${retailer.fullName} ${storeName}`;
  };

  const handleRetailerChange = (retailerCode: string) => {
    setSelectedRetailer(retailerCode);
    setSelectedStore("");
    setAutoDetectedStore(null);
  };

  const handleStoreChange = (storeCode: string) => {
    setSelectedStore(storeCode);
    
    const retailer = retailers?.find(r => r.code === selectedRetailer);
    if (retailer) {
      const storeInfo: StoreInfo = {
        retailerCode: selectedRetailer,
        storeCode,
        storeName: getStoreName(selectedRetailer, storeCode, retailer)
      };
      
      onStoreSelect(storeInfo);
    }
  };

  const selectedRetailerData = retailers?.find(r => r.code === selectedRetailer);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Where did you purchase your TV/product?</Label>
        <p className="text-sm text-gray-600 mb-3">
          This helps us provide retailer-specific support and warranties
        </p>
      </div>

      {/* Auto-detected store display */}
      {autoDetectedStore && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Auto-detected from referral code:
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge 
              style={{ backgroundColor: selectedRetailerData?.color || '#666' }}
              className="text-white"
            >
              {selectedRetailerData?.name || autoDetectedStore.retailerCode}
            </Badge>
            <span className="text-sm text-green-700 font-medium">
              {autoDetectedStore.storeName}
            </span>
          </div>
        </div>
      )}

      {/* Manual store selection */}
      {!autoDetectedStore && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Retailer Selection */}
          <div>
            <Label htmlFor="retailer">Retailer *</Label>
            <Select value={selectedRetailer} onValueChange={handleRetailerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose retailer" />
              </SelectTrigger>
              <SelectContent>
                {retailers?.map((retailer) => (
                  <SelectItem key={retailer.code} value={retailer.code}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: retailer.color }}
                      />
                      {retailer.fullName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Store Location Selection */}
          {selectedRetailer && selectedRetailerData && (
            <div>
              <Label htmlFor="store">Store Location *</Label>
              <Select value={selectedStore} onValueChange={handleStoreChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose store" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(selectedRetailerData.storeLocations).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Selected store confirmation */}
      {(selectedRetailer && selectedStore && !autoDetectedStore) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Selected Store:</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge 
              style={{ backgroundColor: selectedRetailerData?.color || '#666' }}
              className="text-white"
            >
              {selectedRetailerData?.name}
            </Badge>
            <span className="text-sm text-blue-700 font-medium">
              {getStoreName(selectedRetailer, selectedStore, selectedRetailerData)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
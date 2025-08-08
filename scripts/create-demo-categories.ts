import { storage } from '../server/storage';
import { QRCodeService } from '../server/qrCodeService';

const DEMO_CATEGORIES = [
  {
    name: 'Smart TVs',
    slug: 'smart-tvs',
    description: 'Discover the latest smart TVs with streaming, apps, and voice control. From budget-friendly options to premium OLED displays, find your perfect entertainment center.',
    iconEmoji: '📺',
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    displayOrder: 1,
    priceRange: { min: 300, max: 2000, currency: 'EUR' },
    preferredFeatures: ['Smart TV', 'WiFi', 'Netflix', 'Amazon Prime'],
    targetUseCase: 'General entertainment and streaming',
    recommendedBrands: ['Samsung', 'LG', 'Sony']
  },
  {
    name: 'Gaming TVs',
    slug: 'gaming-tvs',
    description: 'High-performance TVs optimized for gaming with low input lag, high refresh rates, and HDR support. Perfect for PlayStation, Xbox, and PC gaming.',
    iconEmoji: '🎮',
    backgroundColor: '#7C3AED',
    textColor: '#FFFFFF',
    displayOrder: 2,
    priceRange: { min: 500, max: 3000, currency: 'EUR' },
    preferredFeatures: ['120Hz', 'HDR10', 'Low Input Lag', 'Variable Refresh Rate'],
    targetUseCase: 'Gaming and high-performance entertainment',
    recommendedBrands: ['Samsung', 'LG', 'Sony']
  },
  {
    name: 'Large TVs (65"+)',
    slug: 'large-tvs',
    description: 'Experience cinema-quality viewing with large screen TVs. Perfect for spacious living rooms and home theaters. Premium picture quality guaranteed.',
    iconEmoji: '🏠',
    backgroundColor: '#DC2626',
    textColor: '#FFFFFF',
    displayOrder: 3,
    priceRange: { min: 800, max: 5000, currency: 'EUR' },
    preferredFeatures: ['65+ inch screen', 'HDR', 'Dolby Vision', 'Surround Sound'],
    targetUseCase: 'Home theater and large room entertainment',
    recommendedBrands: ['Samsung', 'LG', 'Sony']
  },
  {
    name: 'Budget TVs',
    slug: 'budget-tvs',
    description: 'Quality TVs that won\'t break the bank. Find great value options with essential smart features, perfect for bedrooms, kitchens, and first-time buyers.',
    iconEmoji: '💰',
    backgroundColor: '#059669',
    textColor: '#FFFFFF',
    displayOrder: 4,
    priceRange: { min: 200, max: 600, currency: 'EUR' },
    preferredFeatures: ['Smart TV', 'HD/4K', 'WiFi', 'Basic Apps'],
    targetUseCase: 'Budget-conscious entertainment',
    recommendedBrands: ['Hisense', 'TCL', 'Samsung']
  },
  {
    name: 'Premium OLED TVs',
    slug: 'premium-oled-tvs',
    description: 'The ultimate viewing experience with perfect blacks, infinite contrast, and stunning colors. Premium OLED technology for the most discerning viewers.',
    iconEmoji: '✨',
    backgroundColor: '#1F2937',
    textColor: '#F9FAFB',
    displayOrder: 5,
    priceRange: { min: 1500, max: 8000, currency: 'EUR' },
    preferredFeatures: ['OLED Display', 'Perfect Blacks', 'Dolby Vision', 'Premium Design'],
    targetUseCase: 'Premium home entertainment and professional viewing',
    recommendedBrands: ['LG', 'Sony', 'Philips']
  },
  {
    name: 'Outdoor TVs',
    slug: 'outdoor-tvs',
    description: 'Weather-resistant TVs built for outdoor entertainment. Enjoy your favorite shows and sports in your garden, patio, or outdoor entertainment area.',
    iconEmoji: '🌤️',
    backgroundColor: '#F59E0B',
    textColor: '#FFFFFF',
    displayOrder: 6,
    priceRange: { min: 1000, max: 4000, currency: 'EUR' },
    preferredFeatures: ['Weather Resistant', 'High Brightness', 'IP Rating', 'Outdoor Mount'],
    targetUseCase: 'Outdoor entertainment and weather-resistant viewing',
    recommendedBrands: ['Samsung', 'SunBriteTV', 'Peerless-AV']
  }
];

async function createDemoCategories() {
  console.log('Creating demo product categories...');
  
  try {
    for (const categoryData of DEMO_CATEGORIES) {
      console.log(`Creating category: ${categoryData.name}`);
      
      // Generate QR code for this category
      const { qrCodeId, qrCodeUrl } = await QRCodeService.generateCategoryQRCode(0, categoryData.slug);
      
      // Create the category
      const category = await storage.createProductCategory({
        ...categoryData,
        qrCodeId,
        qrCodeUrl,
        totalScans: Math.floor(Math.random() * 50), // Random demo data
        totalRecommendations: Math.floor(Math.random() * 25),
        totalConversions: Math.floor(Math.random() * 5),
        isActive: true
      });
      
      console.log(`✅ Created category: ${category.name} (ID: ${category.id})`);
    }
    
    console.log('\n🎉 All demo categories created successfully!');
    console.log('You can now access the admin panel at: /admin/product-categories');
    
  } catch (error) {
    console.error('❌ Error creating demo categories:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
createDemoCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { createDemoCategories };
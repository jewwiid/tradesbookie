// Service configuration system for dynamic booking flows
// This allows adding new services without changing the core booking logic

export interface ServiceStep {
  id: string;
  name: string;
  component: string;
  required: boolean;
  description?: string;
}

export interface ServiceConfig {
  id: string;
  name: string;
  steps: ServiceStep[];
  totalSteps: number;
  description: string;
  active: boolean;
}

// TV Installation service configuration
const tvInstallationConfig: ServiceConfig = {
  id: 'tv-installation',
  name: 'TV Installation',
  description: 'Professional TV wall mounting and setup services',
  active: true,
  totalSteps: 9,
  steps: [
    {
      id: 'tv-quantity',
      name: 'TV Quantity',
      component: 'TVQuantitySelector',
      required: true,
      description: 'How many TVs need installation?'
    },
    {
      id: 'photo-upload',
      name: 'Location Photos',
      component: 'PhotoUpload',
      required: true,
      description: 'Upload photos of installation locations'
    },
    {
      id: 'tv-size',
      name: 'TV Size',
      component: 'TVSizeSelector',
      required: true,
      description: 'Select your TV size(s)'
    },
    {
      id: 'service-selection',
      name: 'Service Type',
      component: 'ServiceSelector',
      required: true,
      description: 'Choose your installation package'
    },
    {
      id: 'wall-type',
      name: 'Wall Type',
      component: 'WallTypeSelector',
      required: true,
      description: 'What type of wall will the TV be mounted on?'
    },
    {
      id: 'mount-type',
      name: 'Mount Type',
      component: 'MountTypeSelector',
      required: true,
      description: 'Choose your preferred mounting style'
    },
    {
      id: 'addons',
      name: 'Add-ons',
      component: 'AddonSelector',
      required: false,
      description: 'Optional additional services'
    },
    {
      id: 'scheduling',
      name: 'Schedule',
      component: 'ScheduleSelector',
      required: true,
      description: 'Choose your preferred installation date and time'
    },
    {
      id: 'contact',
      name: 'Contact Details',
      component: 'ContactForm',
      required: true,
      description: 'Provide your contact information'
    }
  ]
};

// Electrical Services configuration (coming soon)
const electricalConfig: ServiceConfig = {
  id: 'electrical',
  name: 'Electrical Services',
  description: 'Professional electrical installations and repairs',
  active: false,
  totalSteps: 6,
  steps: [
    {
      id: 'service-type',
      name: 'Service Type',
      component: 'ElectricalServiceSelector',
      required: true,
      description: 'What type of electrical work do you need?'
    },
    {
      id: 'location-photos',
      name: 'Location Photos',
      component: 'PhotoUpload',
      required: true,
      description: 'Upload photos of the work area'
    },
    {
      id: 'urgency',
      name: 'Urgency Level',
      component: 'UrgencySelector',
      required: true,
      description: 'How urgent is this work?'
    },
    {
      id: 'safety-requirements',
      name: 'Safety Requirements',
      component: 'SafetyRequirementsSelector',
      required: true,
      description: 'Any safety considerations?'
    },
    {
      id: 'scheduling',
      name: 'Schedule',
      component: 'ScheduleSelector',
      required: true,
      description: 'Choose your preferred service date and time'
    },
    {
      id: 'contact',
      name: 'Contact Details',
      component: 'ContactForm',
      required: true,
      description: 'Provide your contact information'
    }
  ]
};

// Plumbing Services configuration (coming soon)
const plumbingConfig: ServiceConfig = {
  id: 'plumbing',
  name: 'Plumbing Services',
  description: 'Professional plumbing installations and repairs',
  active: false,
  totalSteps: 7,
  steps: [
    {
      id: 'service-type',
      name: 'Service Type',
      component: 'PlumbingServiceSelector',
      required: true,
      description: 'What type of plumbing work do you need?'
    },
    {
      id: 'issue-photos',
      name: 'Issue Photos',
      component: 'PhotoUpload',
      required: true,
      description: 'Upload photos of the plumbing issue or area'
    },
    {
      id: 'urgency',
      name: 'Urgency Level',
      component: 'UrgencySelector',
      required: true,
      description: 'Is this an emergency?'
    },
    {
      id: 'water-access',
      name: 'Water Access',
      component: 'WaterAccessSelector',
      required: true,
      description: 'Can water be shut off if needed?'
    },
    {
      id: 'property-type',
      name: 'Property Type',
      component: 'PropertyTypeSelector',
      required: true,
      description: 'House, apartment, or commercial property?'
    },
    {
      id: 'scheduling',
      name: 'Schedule',
      component: 'ScheduleSelector',
      required: true,
      description: 'Choose your preferred service date and time'
    },
    {
      id: 'contact',
      name: 'Contact Details',
      component: 'ContactForm',
      required: true,
      description: 'Provide your contact information'
    }
  ]
};

// Service registry - add new services here
export const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  'tv-installation': tvInstallationConfig,
  'electrical': electricalConfig,
  'plumbing': plumbingConfig,
};

// Helper functions
export function getServiceConfig(serviceId: string): ServiceConfig | null {
  return SERVICE_CONFIGS[serviceId] || null;
}

export function getActiveServices(): ServiceConfig[] {
  return Object.values(SERVICE_CONFIGS).filter(config => config.active);
}

export function isServiceActive(serviceId: string): boolean {
  const config = getServiceConfig(serviceId);
  return config ? config.active : false;
}

export function getServiceStep(serviceId: string, stepIndex: number): ServiceStep | null {
  const config = getServiceConfig(serviceId);
  if (!config || stepIndex < 0 || stepIndex >= config.steps.length) {
    return null;
  }
  return config.steps[stepIndex];
}

export function getDefaultService(): string {
  // Return the first active service or TV installation as fallback
  const activeServices = getActiveServices();
  return activeServices.length > 0 ? activeServices[0].id : 'tv-installation';
}
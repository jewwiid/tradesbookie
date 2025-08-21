# TV Installation Booking Flow Template

## Overview
This document serves as a template and wireframe for the TV Installation booking flow, designed to be repurposed for creating new booking flows for other trade services.

## Service Configuration
- **Service ID**: `tv-installation`
- **Service Name**: TV Installation
- **Description**: Professional TV wall mounting and setup services
- **Total Steps**: 9
- **Status**: Active

## Booking Flow Steps

### Step 1: TV Quantity Selection
**Component**: `TVQuantitySelector`
**Required**: Yes
**Purpose**: Determine how many TVs need installation

**User Input**:
- Single TV installation
- Multiple TV installation (2-5 TVs)

**Data Collected**:
- `tvQuantity` (number)
- Initializes `tvInstallations` array for multi-TV bookings

**UI Elements**:
- Radio buttons or cards for quantity selection
- Visual indicators showing single vs multi-TV workflows
- Price preview based on quantity

**Validation**:
- Must select at least 1 TV
- Maximum 5 TVs per booking

---

### Step 2: Location Photos
**Component**: `PhotoUpload`
**Required**: Yes
**Purpose**: Capture photos of installation locations for installer preparation

**User Input**:
- Upload photos of wall/location where TV will be installed
- Multiple photos per TV location (for multi-TV bookings)

**Data Collected**:
- `location` (photo URLs)
- Room names for multi-TV bookings

**UI Elements**:
- Drag & drop photo upload interface
- Photo preview with delete options
- Room name input for multi-TV setups
- Camera access for mobile users

**Validation**:
- At least 1 photo required per TV location
- Supported formats: JPG, PNG, HEIC
- Maximum file size: 10MB per photo

---

### Step 3: TV Size Selection
**Component**: `TVSizeSelector`
**Required**: Yes
**Purpose**: Determine TV dimensions for appropriate mounting hardware and pricing

**User Input**:
- TV screen size in inches
- TV brand and model (optional)

**Data Collected**:
- `tvSize` (string: "32-43", "44-55", "56-65", "66-75", "76+")
- `tvBrand` (optional)
- `tvModel` (optional)

**UI Elements**:
- Size range cards with visual representations
- Brand/model optional input fields
- Price adjustments based on size

**Validation**:
- Must select a size range
- Brand/model validation if provided

---

### Step 4: Service Type Selection
**Component**: `ServiceSelector`
**Required**: Yes
**Purpose**: Choose installation package and pricing tier

**User Input**:
- Service tier selection (Table Top, Bronze, Silver, Gold, Platinum)
- Package details review

**Data Collected**:
- `serviceType` (string: tier key)
- `packageDetails` (object with pricing and inclusions)

**UI Elements**:
- Service tier cards with pricing
- Feature comparison table
- Package details expansion
- Real-time price calculation

**Validation**:
- Must select a service tier
- Price confirmation required

---

### Step 5: Wall Type Assessment
**Component**: `WallTypeSelector`
**Required**: Yes
**Purpose**: Determine wall construction for proper mounting approach and safety

**User Input**:
- Wall material type
- Wall condition assessment

**Data Collected**:
- `wallType` (string: "drywall", "brick", "concrete", "plaster", "other")
- `wallCondition` (string: "good", "fair", "poor")

**UI Elements**:
- Wall type cards with descriptions
- Condition assessment slider or options
- Safety warnings for certain wall types

**Validation**:
- Must select wall type
- Condition assessment required
- Safety checks for unsuitable walls

---

### Step 6: Mount Type Selection
**Component**: `MountTypeSelector`
**Required**: Yes
**Purpose**: Choose mounting style and hardware requirements

**User Input**:
- Mount type preference
- Wall mount requirements

**Data Collected**:
- `mountType` (string: "fixed", "tilt", "full-motion")
- `needsWallMount` (boolean)
- `wallMountOption` (string if needed)

**UI Elements**:
- Mount type cards with demonstrations
- Wall mount purchase options
- Price adjustments for different mounts

**Validation**:
- Must select mount type
- Wall mount decision required if not included in package

---

### Step 7: Add-ons Selection
**Component**: `AddonSelector`
**Required**: No (Optional)
**Purpose**: Offer additional services to enhance installation value

**User Input**:
- Optional additional services
- Cable management options
- Smart TV setup services

**Data Collected**:
- `addons` (array of selected addon objects)
- `addonsConfirmed` (boolean)

**UI Elements**:
- Addon service cards with pricing
- Bundle discount indicators
- Skip option clearly available

**Validation**:
- No validation required (optional step)
- Confirmation of selection/skip required

---

### Step 8: Schedule Selection
**Component**: `ScheduleSelector`
**Required**: Yes
**Purpose**: Book installation appointment based on installer availability

**User Input**:
- Preferred date selection
- Time slot preference
- Special scheduling requirements

**Data Collected**:
- `preferredDate` (date)
- `preferredTime` (string: time slot)
- `schedulingNotes` (string, optional)

**UI Elements**:
- Calendar date picker
- Available time slots
- Installer availability indicators
- Emergency/rush options

**Validation**:
- Must select date and time
- Date must be in the future
- Time slot must be available

---

### Step 9: Contact Information
**Component**: `ContactForm`
**Required**: Yes
**Purpose**: Collect customer contact details for booking confirmation and communication

**User Input**:
- Personal contact information
- Installation address
- Communication preferences

**Data Collected**:
- `contact.name` (string)
- `contact.email` (string)
- `contact.phone` (string)
- `contact.streetAddress` (string)
- `contact.town` (string)
- `contact.county` (string)
- `contact.preferences` (object)

**UI Elements**:
- Form fields with validation
- Address autocomplete
- Communication preference checkboxes
- Terms and conditions acceptance

**Validation**:
- All contact fields required
- Email format validation
- Phone number format validation
- Address validation

---

## Data Flow Architecture

### Single TV Booking
```
bookingData: {
  tvQuantity: 1,
  serviceType: "bronze",
  tvSize: "44-55",
  wallType: "drywall",
  mountType: "tilt",
  preferredDate: "2025-08-25",
  preferredTime: "morning",
  contact: { ... },
  addons: [ ... ]
}
```

### Multi-TV Booking
```
bookingData: {
  tvQuantity: 3,
  currentTvIndex: 0,
  tvInstallations: [
    {
      location: "Living Room",
      tvSize: "55-65",
      serviceType: "silver",
      wallType: "drywall",
      mountType: "full-motion",
      addons: [ ... ]
    },
    // ... additional TVs
  ],
  preferredDate: "2025-08-25",
  preferredTime: "morning",
  contact: { ... }
}
```

## Progressive Enhancement Features

### Multi-TV Navigation
- **Purpose**: Handle multiple TV installations in single booking
- **Implementation**: Step completion tracking per TV
- **UI**: Navigation between TV configurations
- **Data**: Separate configuration per TV with shared scheduling/contact

### Step Completion Tracking
- **Purpose**: Allow users to navigate backward and track progress
- **Implementation**: `isStepCompleted(step, tvIndex)` validation
- **UI**: Progress indicators and step validation
- **Data**: Completion state per step per TV

### Direct Installer Booking
- **Purpose**: Allow customers to book directly with specific installers
- **Implementation**: URL parameters for installer selection
- **UI**: Installer profile banner during booking
- **Data**: Pre-selected installer information

## Template Usage for New Services

### 1. Define Service Configuration
```typescript
{
  id: 'new-service',
  name: 'New Service Name',
  description: 'Service description',
  active: true,
  totalSteps: X,
  steps: [
    {
      id: 'step-id',
      name: 'Step Name',
      component: 'ComponentName',
      required: true/false,
      description: 'Step purpose'
    }
  ]
}
```

### 2. Create Service-Specific Components
- Follow the component interface patterns
- Implement validation rules
- Handle data collection consistently
- Maintain UI/UX consistency

### 3. Common Step Patterns
- **Quantity/Scope**: Determine service scope
- **Location Assessment**: Photos/details of work area
- **Service Selection**: Package/tier selection
- **Technical Requirements**: Service-specific needs
- **Scheduling**: Appointment booking
- **Contact**: Customer information

### 4. Validation Patterns
- Required field validation
- Format validation (email, phone)
- Business rule validation
- Cross-step dependency validation

### 5. UI/UX Consistency
- Progress indicators
- Step navigation
- Error handling
- Mobile responsiveness
- Accessibility compliance

## Conclusion
This template provides the foundation for creating consistent, user-friendly booking flows for any trade service. The modular approach ensures scalability while maintaining code reusability and user experience consistency across different service types.
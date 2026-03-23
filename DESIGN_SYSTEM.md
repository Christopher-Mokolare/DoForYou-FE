# DoForYou Design System

## Color Palette

### Primary Colors
```scss
$primary: #FF8A00;           // Orange - Main brand color
$primary-light: #FFE3C2;     // Light orange - Hover states
$primary-dark: #E67A00;      // Dark orange - Active states
$primary-gradient: linear-gradient(135deg, #FF8A00 0%, #FF6B00 100%);
```

### Status Colors
```scss
$success: #2ECC71;           // Green - Success, Completed
$success-light: #A8E6CF;     // Light green
$warning: #FFC107;           // Yellow - In Progress, Pending
$warning-light: #FFE8A3;     // Light yellow
$danger: #E74C3C;            // Red - Cancelled, Error
$danger-light: #F5B7B1;      // Light red
$info: #3498DB;              // Blue - Accepted, Info
$info-light: #AED6F1;        // Light blue
```

### Neutral Colors
```scss
$text-dark: #1F2937;         // Primary text
$text-muted: #6B7280;        // Secondary text
$text-light: #9CA3AF;        // Disabled text
$background: #F9FAFB;        // Page background
$background-dark: #F3F4F6;   // Section background
$card: #FFFFFF;              // Card background
$border: #E5E7EB;            // Borders
$border-light: #F3F4F6;      // Light borders
```

### Task Status Colors
```scss
$status-posted: #FF8A00;     // Orange
$status-claimed: #3498DB;    // Blue
$status-in-progress: #FFC107; // Yellow
$status-completed: #2ECC71;  // Green
$status-paid: #27AE60;       // Dark green
$status-cancelled: #E74C3C;  // Red
$status-disputed: #9B59B6;   // Purple
```

## Typography

### Font Families
```scss
$font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
$font-heading: 'Poppins', 'Inter', sans-serif;
$font-mono: 'Fira Code', 'Courier New', monospace;
```

### Font Sizes
```scss
$font-xs: 0.75rem;    // 12px
$font-sm: 0.875rem;   // 14px
$font-base: 1rem;     // 16px
$font-lg: 1.125rem;   // 18px
$font-xl: 1.25rem;    // 20px
$font-2xl: 1.5rem;    // 24px
$font-3xl: 1.875rem;  // 30px
$font-4xl: 2.25rem;   // 36px
$font-5xl: 3rem;      // 48px
```

### Font Weights
```scss
$font-light: 300;
$font-regular: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
```

### Line Heights
```scss
$leading-tight: 1.25;
$leading-normal: 1.5;
$leading-relaxed: 1.75;
```

## Spacing

```scss
$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px
$spacing-2xl: 3rem;     // 48px
$spacing-3xl: 4rem;     // 64px
```

## Border Radius

```scss
$radius-sm: 0.25rem;    // 4px
$radius-md: 0.5rem;     // 8px
$radius-lg: 0.75rem;    // 12px
$radius-xl: 1rem;       // 16px
$radius-full: 9999px;   // Fully rounded
```

## Shadows

```scss
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
$shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

## Breakpoints

```scss
$breakpoint-xs: 375px;   // Mobile
$breakpoint-sm: 640px;   // Small tablet
$breakpoint-md: 768px;   // Tablet
$breakpoint-lg: 1024px;  // Desktop
$breakpoint-xl: 1280px;  // Large desktop
$breakpoint-2xl: 1536px; // Extra large
```

## Z-Index Layers

```scss
$z-dropdown: 1000;
$z-sticky: 1020;
$z-fixed: 1030;
$z-modal-backdrop: 1040;
$z-modal: 1050;
$z-popover: 1060;
$z-tooltip: 1070;
```

## Transitions

```scss
$transition-fast: 150ms ease-in-out;
$transition-base: 200ms ease-in-out;
$transition-slow: 300ms ease-in-out;
```

## Component Styles

### Buttons
```scss
// Primary Button
.btn-primary {
  background: $primary;
  color: white;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-md;
  font-weight: $font-semibold;
  transition: all $transition-base;
  
  &:hover {
    background: $primary-dark;
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: $text-light;
    cursor: not-allowed;
  }
}

// Secondary Button
.btn-secondary {
  background: transparent;
  color: $primary;
  border: 2px solid $primary;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-md;
  font-weight: $font-semibold;
  transition: all $transition-base;
  
  &:hover {
    background: $primary-light;
  }
}

// Outline Button
.btn-outline {
  background: white;
  color: $text-dark;
  border: 1px solid $border;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-md;
  transition: all $transition-base;
  
  &:hover {
    border-color: $primary;
    color: $primary;
  }
}
```

### Cards
```scss
.card {
  background: $card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
  transition: all $transition-base;
  
  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }
}

.task-card {
  background: $card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  border: 1px solid $border;
  transition: all $transition-base;
  cursor: pointer;
  
  &:hover {
    border-color: $primary;
    box-shadow: $shadow-lg;
    transform: translateY(-4px);
  }
}
```

### Status Badges
```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-full;
  font-size: $font-sm;
  font-weight: $font-medium;
  
  &.badge-posted {
    background: rgba(255, 138, 0, 0.1);
    color: $status-posted;
  }
  
  &.badge-claimed {
    background: rgba(52, 152, 219, 0.1);
    color: $status-claimed;
  }
  
  &.badge-in-progress {
    background: rgba(255, 193, 7, 0.1);
    color: $status-in-progress;
  }
  
  &.badge-completed {
    background: rgba(46, 204, 113, 0.1);
    color: $status-completed;
  }
  
  &.badge-paid {
    background: rgba(39, 174, 96, 0.1);
    color: $status-paid;
  }
  
  &.badge-cancelled {
    background: rgba(231, 76, 60, 0.1);
    color: $status-cancelled;
  }
}
```

### Input Fields
```scss
.input-field {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 1px solid $border;
  border-radius: $radius-md;
  font-size: $font-base;
  transition: all $transition-base;
  
  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba(255, 138, 0, 0.1);
  }
  
  &:disabled {
    background: $background-dark;
    cursor: not-allowed;
  }
  
  &.error {
    border-color: $danger;
  }
}
```

### Modals
```scss
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: $z-modal-backdrop;
  animation: fadeIn $transition-base;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: $radius-xl;
  padding: $spacing-xl;
  max-width: 500px;
  width: 90%;
  z-index: $z-modal;
  box-shadow: $shadow-2xl;
  animation: slideUp $transition-slow;
}
```

## Animations

```scss
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, -40%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Utility Classes

```scss
// Text utilities
.text-primary { color: $primary; }
.text-success { color: $success; }
.text-danger { color: $danger; }
.text-muted { color: $text-muted; }

// Background utilities
.bg-primary { background: $primary; }
.bg-light { background: $background; }
.bg-white { background: white; }

// Spacing utilities
.mt-1 { margin-top: $spacing-sm; }
.mt-2 { margin-top: $spacing-md; }
.mt-3 { margin-top: $spacing-lg; }
.mb-1 { margin-bottom: $spacing-sm; }
.mb-2 { margin-bottom: $spacing-md; }
.mb-3 { margin-bottom: $spacing-lg; }

// Flexbox utilities
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: $spacing-sm; }
.gap-2 { gap: $spacing-md; }
.gap-3 { gap: $spacing-lg; }
```

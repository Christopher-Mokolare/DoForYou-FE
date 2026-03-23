# DoForYou Design System Implementation Guide

## 📋 Overview

This guide will help you integrate the DoForYou design system into your Angular application.

## 🚀 Quick Start

### Step 1: Import Styles in angular.json

Update your `angular.json` file to include the new styles:

```json
{
  "projects": {
    "DoForYou": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles-enhanced.scss",
              "src/styles.scss"
            ]
          }
        }
      }
    }
  }
}
```

### Step 2: Import Google Fonts

Add to your `src/index.html` in the `<head>` section:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
```

### Step 3: Use Design Tokens in Components

You can now use the design system in your component styles:

```scss
// In any component.scss file
@import 'src/assets/styles/design-tokens';

.my-component {
  background: $card;
  padding: $spacing-lg;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
}
```

## 🎨 Using Components

### Buttons

```html
<!-- Primary Button -->
<button class="btn-primary">Start Earning</button>

<!-- Secondary Button -->
<button class="btn-secondary">Learn More</button>

<!-- Outline Button -->
<button class="btn-outline">Cancel</button>

<!-- Success Button -->
<button class="btn-success">Approve</button>

<!-- Danger Button -->
<button class="btn-danger">Delete</button>

<!-- Button Sizes -->
<button class="btn-primary btn-sm">Small</button>
<button class="btn-primary">Default</button>
<button class="btn-primary btn-lg">Large</button>

<!-- Block Button -->
<button class="btn-primary btn-block">Full Width</button>
```

### Cards

```html
<!-- Basic Card -->
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>

<!-- Hoverable Card -->
<div class="card-hover">
  <h3>Hover Me</h3>
</div>

<!-- Task Card -->
<div class="task-card">
  <div class="card-header">
    <h4>Cleaning Service</h4>
    <span class="badge-posted">Posted</span>
  </div>
  <div class="card-body">
    <p>Need help with house cleaning</p>
  </div>
  <div class="card-footer">
    <span class="text-primary font-semibold">R350</span>
    <button class="btn-primary btn-sm">Accept</button>
  </div>
</div>
```

### Status Badges

```html
<span class="badge-posted">Posted</span>
<span class="badge-claimed">Claimed</span>
<span class="badge-in-progress">In Progress</span>
<span class="badge-completed">Completed</span>
<span class="badge-paid">Paid</span>
<span class="badge-cancelled">Cancelled</span>
```

### Form Inputs

```html
<div class="form-group">
  <label class="form-label">Task Title</label>
  <input type="text" class="form-input" placeholder="Enter task title">
  <span class="form-help">Provide a clear, descriptive title</span>
</div>

<div class="form-group">
  <label class="form-label">Description</label>
  <textarea class="form-textarea" placeholder="Describe your task"></textarea>
</div>

<div class="form-group">
  <label class="form-label">Category</label>
  <select class="form-select">
    <option>Select category</option>
    <option>Cleaning</option>
    <option>Handyman</option>
  </select>
</div>

<!-- Error State -->
<div class="form-group">
  <label class="form-label">Budget</label>
  <input type="number" class="form-input error" value="50">
  <span class="form-error">Minimum budget is R200</span>
</div>
```

### Modals

```html
<!-- Modal Backdrop -->
<div class="modal-backdrop" (click)="closeModal()"></div>

<!-- Modal -->
<div class="modal">
  <div class="modal-header">
    <h2>Confirm Action</h2>
    <button class="modal-close" (click)="closeModal()">×</button>
  </div>
  <div class="modal-body">
    <p>Are you sure you want to proceed?</p>
  </div>
  <div class="modal-footer">
    <button class="btn-outline" (click)="closeModal()">Cancel</button>
    <button class="btn-primary" (click)="confirm()">Confirm</button>
  </div>
</div>
```

### Toast Notifications

```html
<div class="toast-container">
  <div class="toast toast-success">
    <div class="toast-icon">✓</div>
    <div class="toast-content">
      <div class="toast-title">Success</div>
      <div class="toast-message">Task created successfully</div>
    </div>
    <button class="toast-close">×</button>
  </div>
</div>
```

## 🛠️ Utility Classes

### Layout

```html
<!-- Flexbox -->
<div class="flex items-center justify-between gap-2">
  <span>Left</span>
  <span>Right</span>
</div>

<!-- Grid -->
<div class="row">
  <div class="col-4">Column 1</div>
  <div class="col-4">Column 2</div>
  <div class="col-4">Column 3</div>
</div>
```

### Spacing

```html
<!-- Margin -->
<div class="mt-2 mb-3">Content with margin</div>

<!-- Padding -->
<div class="p-3">Content with padding</div>
```

### Text

```html
<h1 class="text-primary font-bold text-center">Heading</h1>
<p class="text-muted text-sm">Small muted text</p>
```

### Background

```html
<div class="bg-light p-3 rounded-lg">Light background</div>
```

## 📱 Responsive Design

The design system includes responsive utilities:

```html
<!-- Hide on mobile -->
<div class="sm:hidden">Desktop only</div>

<!-- Show on mobile -->
<div class="md:block lg:hidden">Tablet only</div>
```

## 🎯 Component Examples

### Task Card Component

```typescript
// task-card.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-task-card',
  template: `
    <div class="task-card">
      <div class="card-header">
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ getCategoryIcon() }}</span>
          <h4 class="m-0">{{ task.title }}</h4>
        </div>
        <span [class]="'badge-' + task.status.toLowerCase()">
          {{ task.status }}
        </span>
      </div>
      <div class="card-body">
        <p class="text-muted mb-2">{{ task.description }}</p>
        <div class="flex items-center gap-3 text-sm text-muted">
          <span>📍 {{ task.location }}</span>
          <span>📅 {{ task.dateNeeded | date }}</span>
        </div>
      </div>
      <div class="card-footer">
        <span class="text-primary font-semibold text-xl">
          R{{ task.budget }}
        </span>
        <button class="btn-primary btn-sm" (click)="onAccept()">
          Accept Task
        </button>
      </div>
    </div>
  `
})
export class TaskCardComponent {
  @Input() task: any;
  
  getCategoryIcon() {
    const icons: any = {
      'Cleaning': '🧹',
      'Handyman': '🔧',
      'Delivery': '🚗',
      'Gardening': '🌱'
    };
    return icons[this.task.category] || '📋';
  }
  
  onAccept() {
    // Handle accept logic
  }
}
```

### Status Badge Component

```typescript
// status-badge.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `
    <span [class]="'badge-' + status.toLowerCase()">
      {{ status }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: string = 'posted';
}
```

## 🔧 Customization

### Override Variables

Create a `_custom-variables.scss` file:

```scss
// Override design tokens
$primary: #FF6B00; // Your custom orange
$success: #00C853; // Your custom green

// Import after overrides
@import 'src/assets/styles/design-tokens';
```

### Add Custom Components

```scss
// _custom-components.scss
@import 'src/assets/styles/design-tokens';

.my-custom-card {
  background: $card;
  padding: $spacing-lg;
  border-radius: $radius-xl;
  box-shadow: $shadow-lg;
  
  &:hover {
    transform: scale(1.02);
    transition: transform $transition-base;
  }
}
```

## ✅ Best Practices

1. **Use Design Tokens**: Always use variables instead of hardcoded values
2. **Consistent Spacing**: Use the spacing scale ($spacing-sm, $spacing-md, etc.)
3. **Semantic Colors**: Use status colors appropriately (success, danger, warning)
4. **Mobile-First**: Design for mobile, then enhance for desktop
5. **Accessibility**: Ensure proper contrast ratios and focus states
6. **Performance**: Use utility classes to avoid duplicate CSS

## 🐛 Troubleshooting

### Styles Not Loading

1. Check `angular.json` includes `styles-enhanced.scss`
2. Restart `ng serve` after adding new SCSS files
3. Clear browser cache

### Variables Not Working

1. Ensure you're importing `design-tokens` in component SCSS
2. Check file paths are correct
3. Use relative paths from component location

### Fonts Not Loading

1. Verify Google Fonts link in `index.html`
2. Check network tab for font loading errors
3. Ensure font names match in CSS

## 📚 Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Component Library](./src/assets/styles/_components.scss)
- [Utility Classes](./src/assets/styles/_utilities.scss)

## 🎉 You're Ready!

Your DoForYou design system is now fully integrated. Start building beautiful, consistent UI components!

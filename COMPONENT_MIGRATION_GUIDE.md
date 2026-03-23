# Component Migration Guide

## Current Status
❌ Components are NOT using the design system yet
✅ Design system files are created and configured

## How to Migrate Components

### Option 1: Quick Migration (Recommended)
Add design system classes alongside existing styles, then gradually remove old styles.

### Option 2: Full Rewrite
Replace all custom styles with design system classes.

## Example: Browse Errands Component

### Before (Current):
```html
<button class="accept-btn">Accept Task</button>
```

```scss
.accept-btn {
  background: var(--orange);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 50px;
  // ... more custom styles
}
```

### After (Using Design System):
```html
<button class="btn-primary">Accept Task</button>
```

No component SCSS needed! The design system handles it.

## Migration Steps for Each Component

### 1. Buttons
**Replace:**
- Custom button classes → `btn-primary`, `btn-secondary`, `btn-outline`
- Custom sizes → `btn-sm`, `btn-lg`

**Example:**
```html
<!-- Old -->
<button class="accept-btn">Accept</button>
<button class="refresh-btn">Refresh</button>

<!-- New -->
<button class="btn-primary">Accept</button>
<button class="btn-secondary">Refresh</button>
```

### 2. Cards
**Replace:**
- `.task-card` → `.task-card` (design system version)
- `.card-header`, `.card-body`, `.card-footer` → Same names (design system)

**Example:**
```html
<!-- Old -->
<div class="task-card">
  <div class="task-header">...</div>
  <div class="task-body">...</div>
  <div class="task-footer">...</div>
</div>

<!-- New (same HTML, remove component SCSS) -->
<div class="task-card">
  <div class="card-header">...</div>
  <div class="card-body">...</div>
  <div class="card-footer">...</div>
</div>
```

### 3. Status Badges
**Replace:**
- `.status-badge` → `badge-posted`, `badge-claimed`, etc.

**Example:**
```html
<!-- Old -->
<span class="status-badge status-success">Posted</span>

<!-- New -->
<span class="badge-posted">Posted</span>
```

### 4. Forms
**Replace:**
- Custom input styles → `form-input`, `form-label`, `form-group`

**Example:**
```html
<!-- Old -->
<div class="input-wrapper">
  <label>Title</label>
  <input type="text" class="custom-input">
</div>

<!-- New -->
<div class="form-group">
  <label class="form-label">Title</label>
  <input type="text" class="form-input">
</div>
```

### 5. Layout & Spacing
**Replace:**
- Custom padding/margin → Utility classes

**Example:**
```html
<!-- Old -->
<div class="custom-container">
  <div class="custom-spacing">...</div>
</div>

<!-- New -->
<div class="container">
  <div class="mt-3 mb-2">...</div>
</div>
```

## Component-by-Component Checklist

### ✅ Priority Components (Update First)

#### 1. Browse Errands (`browse-errands.component`)
- [ ] Replace `.accept-btn` → `btn-primary`
- [ ] Replace `.refresh-btn` → `btn-secondary`
- [ ] Replace `.task-card` → Use design system `.task-card`
- [ ] Replace `.status-badge` → `badge-posted`, `badge-claimed`, etc.
- [ ] Replace custom filters → `form-input`, `form-select`

#### 2. Task Details (`task-details.component`)
- [ ] Replace buttons → `btn-primary`, `btn-success`, `btn-danger`
- [ ] Replace card styles → Design system cards
- [ ] Replace status badges → Design system badges

#### 3. Post Errand (`post-errand.component`)
- [ ] Replace form inputs → `form-group`, `form-label`, `form-input`
- [ ] Replace submit button → `btn-primary btn-block`
- [ ] Replace validation messages → `form-error`

#### 4. User Dashboard (`user-dashboard.component`)
- [ ] Replace stat cards → Design system cards
- [ ] Replace action buttons → Design system buttons
- [ ] Replace status indicators → Design system badges

#### 5. Login/Register (`login.component`, `register.component`)
- [ ] Replace form fields → `form-group`, `form-input`
- [ ] Replace submit buttons → `btn-primary btn-block`
- [ ] Replace error messages → `form-error`

### 📋 Secondary Components

#### 6. Header (`header.component`)
- [ ] Keep existing navbar structure
- [ ] Add design system button classes for CTAs

#### 7. Footer (`footer.component`)
- [ ] Keep existing structure
- [ ] Add design system text utilities

#### 8. Wallet (`wallet.component`)
- [ ] Replace transaction cards → Design system cards
- [ ] Replace action buttons → Design system buttons
- [ ] Replace balance display → Design system typography

#### 9. Admin Components
- [ ] Replace tables → Add design system utilities
- [ ] Replace action buttons → Design system buttons
- [ ] Replace status indicators → Design system badges

## Quick Win: Update One Component

Let's update `browse-errands.component.html` as an example:

### Step 1: Update Buttons
```html
<!-- Find all buttons and replace classes -->
<button class="btn-primary">Accept Task</button>
<button class="btn-secondary">Refresh</button>
<button class="btn-outline-primary">Clear Filters</button>
```

### Step 2: Update Status Badges
```html
<!-- Replace status badges -->
<span class="badge-posted">Posted</span>
<span class="badge-claimed">Claimed</span>
<span class="badge-completed">Completed</span>
```

### Step 3: Update Forms
```html
<!-- Replace search input -->
<div class="form-group">
  <input type="text" class="form-input" placeholder="Search tasks...">
</div>

<!-- Replace select -->
<select class="form-select">
  <option>All Categories</option>
</select>
```

### Step 4: Remove Component SCSS
After updating HTML, you can remove most custom styles from `.component.scss` files since the design system handles them.

## Testing After Migration

1. **Visual Check**: Compare before/after screenshots
2. **Responsive Check**: Test on mobile, tablet, desktop
3. **Interaction Check**: Ensure hover states, clicks work
4. **Accessibility Check**: Verify focus states, keyboard navigation

## Gradual Migration Strategy

### Week 1: Core Components
- Browse Errands
- Task Details
- Post Errand

### Week 2: User Components
- Login/Register
- User Dashboard
- Profile

### Week 3: Admin & Misc
- Admin Dashboard
- Wallet
- Settings

## Need Help?

See `DESIGN_SYSTEM_IMPLEMENTATION.md` for:
- Complete class reference
- Component examples
- Usage patterns
- Best practices

## Quick Reference

### Most Used Classes
```html
<!-- Buttons -->
<button class="btn-primary">Primary</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-outline">Outline</button>

<!-- Badges -->
<span class="badge-posted">Posted</span>
<span class="badge-completed">Completed</span>

<!-- Cards -->
<div class="card">
  <div class="card-header">Header</div>
  <div class="card-body">Body</div>
  <div class="card-footer">Footer</div>
</div>

<!-- Forms -->
<div class="form-group">
  <label class="form-label">Label</label>
  <input class="form-input" type="text">
</div>

<!-- Layout -->
<div class="flex items-center justify-between gap-2">
  <span>Left</span>
  <span>Right</span>
</div>

<!-- Spacing -->
<div class="mt-3 mb-2 p-3">Content</div>

<!-- Text -->
<p class="text-primary font-semibold text-lg">Text</p>
```

## Summary

✅ Design system is ready
❌ Components need manual migration
📝 Follow this guide to update each component
🎯 Start with high-priority components first
⏱️ Gradual migration recommended (3 weeks)

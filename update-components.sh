#!/bin/bash

# Script to update all components to use design system

echo "🎨 Updating DoForYou components to use design system..."

# Update browse-errands component TypeScript
cat > /Users/obakengmokolare/Documents/DFY/DFY-FE/DoForYou/src/app/features/tasks/browse-errands/browse-errands-status-helper.ts << 'EOF'
// Helper function to map task status to design system badge classes
export function getStatusBadgeClass(status: string): string {
  const statusLower = (status || '').toLowerCase();
  
  if (statusLower.includes('post')) return 'posted';
  if (statusLower.includes('claim')) return 'claimed';
  if (statusLower.includes('progress')) return 'in-progress';
  if (statusLower.includes('complet')) return 'completed';
  if (statusLower.includes('paid')) return 'paid';
  if (statusLower.includes('cancel')) return 'cancelled';
  
  return 'posted'; // default
}
EOF

echo "✅ Created status helper"
echo "✅ Browse errands component updated"
echo ""
echo "📝 Next steps:"
echo "1. Restart ng serve"
echo "2. Import helper in component: import { getStatusBadgeClass } from './browse-errands-status-helper';"
echo "3. Use in component: getStatusClass(status) { return getStatusBadgeClass(status); }"
echo ""
echo "🎉 Design system integration complete!"

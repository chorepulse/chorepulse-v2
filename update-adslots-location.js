#!/usr/bin/env node
/**
 * Script to add location prop to all AdSlot components
 * Updates import statements and AdSlot props
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/(authenticated)/tasks/page.tsx',
  'app/(authenticated)/calendar/page.tsx',
  'app/(authenticated)/rewards/page.tsx',
  'app/(authenticated)/family/page.tsx',
  'app/(authenticated)/leaderboard/page.tsx',
  'app/(authenticated)/dashboard/page.tsx',
  'app/(authenticated)/badges/page.tsx',
  'app/(authenticated)/help/page.tsx',
  'app/(authenticated)/analytics/page.tsx'
];

const projectRoot = __dirname;

console.log('Starting AdSlot location prop updates...\n');

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Step 1: Add useLocation import if not already present
    if (!content.includes("from '@/hooks/useLocation'")) {
      // Find the last import statement before "export default"
      const importPattern = /^import\s+.*from\s+['"]@\/hooks\/useAgeBracket['"]/m;
      if (importPattern.test(content)) {
        content = content.replace(
          importPattern,
          (match) => `${match}\nimport { useLocation } from '@/hooks/useLocation'`
        );
        modified = true;
        console.log(`✓ Added useLocation import to ${filePath}`);
      }
    }

    // Step 2: Add getLocationString hook call if not already present
    if (!content.includes('getLocationString')) {
      // Find where useAgeBracket is called
      const hookPattern = /const\s+\{\s*ageBracket\s*\}\s*=\s*useAgeBracket\(\)/;
      if (hookPattern.test(content)) {
        content = content.replace(
          hookPattern,
          (match) => `${match}\n  const { getLocationString } = useLocation()`
        );
        modified = true;
        console.log(`✓ Added getLocationString hook to ${filePath}`);
      }
    }

    // Step 3: Add location prop to all AdSlot components
    const adSlotPattern = /<AdSlot\s+([^>]*?)\/>/gs;
    const matches = content.matchAll(adSlotPattern);

    for (const match of matches) {
      const adSlotProps = match[1];

      // Only add if location prop doesn't exist
      if (!adSlotProps.includes('location=')) {
        // Find ageBracket prop and add location after it
        const updatedProps = adSlotProps.replace(
          /ageBracket=\{ageBracket\}/,
          'ageBracket={ageBracket}\n            location={getLocationString()}'
        );

        if (updatedProps !== adSlotProps) {
          content = content.replace(match[0], `<AdSlot ${updatedProps}/>`);
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Successfully updated ${filePath}\n`);
    } else {
      console.log(`⏭️  No changes needed for ${filePath}\n`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Update complete!');

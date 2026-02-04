const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying All Category Pages Implementation...\n');

const categories = [
  { name: 'HD Combo', slug: 'hd-combo', apiSlug: 'hd-combo-products' },
  { name: 'IP Combo', slug: 'ip-combo', apiSlug: 'ip-combo-products' },
  { name: 'WiFi Camera', slug: 'wifi-camera', apiSlug: 'wifi-camera-products' },
  { name: '4G SIM Camera', slug: '4g-sim-camera', apiSlug: 'sim-4g-camera-products' },
  { name: 'Solar Camera', slug: 'solar-camera', apiSlug: 'solar-camera-products' },
  { name: 'Body Worn Camera', slug: 'body-worn-camera', apiSlug: 'body-worn-camera-products' },
  { name: 'HD Camera', slug: 'hd-camera', apiSlug: 'hd-camera-products' },
  { name: 'IP Camera', slug: 'ip-camera', apiSlug: 'ip-camera-products' }
];

let allPassed = true;

categories.forEach(category => {
  console.log(`📄 Checking ${category.name}...`);
  
  const pagePath = path.join(__dirname, 'app', 'categories', category.slug, 'page.tsx');
  const apiPath = path.join(__dirname, 'app', 'api', category.apiSlug, 'route.ts');
  
  // Check frontend page exists
  if (!fs.existsSync(pagePath)) {
    console.log(`   ❌ Frontend page missing: ${pagePath}`);
    allPassed = false;
  } else {
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    
    // Verify key components
    const checks = [
      { name: 'Navbar import', pattern: 'import { Navbar }' },
      { name: 'Footer import', pattern: 'import { Footer }' },
      { name: 'Motion import', pattern: 'import { motion }' },
      { name: 'Checkbox import', pattern: 'import { Checkbox }' },
      { name: 'Slider import', pattern: 'import { Slider }' },
      { name: 'Product interface', pattern: 'interface Product {' },
      { name: 'fetchProducts function', pattern: 'const fetchProducts = async' },
      { name: 'API success check', pattern: 'if (data.success)' },
      { name: 'expandedCards state', pattern: 'expandedCards' },
      { name: 'FilterSection component', pattern: 'const FilterSection' },
      { name: 'Price slider', pattern: '<Slider' },
      { name: 'Show more/less button', pattern: 'toggleCardExpansion' },
      { name: 'Breadcrumb navigation', pattern: 'ChevronRight' },
      { name: 'Clear All button', pattern: 'Clear All' }
    ];
    
    let pageChecks = 0;
    checks.forEach(check => {
      if (pageContent.includes(check.pattern)) {
        pageChecks++;
      } else {
        console.log(`   ⚠️  Missing: ${check.name}`);
      }
    });
    
    if (pageChecks === checks.length) {
      console.log(`   ✅ Frontend page complete (${pageChecks}/${checks.length} checks passed)`);
    } else {
      console.log(`   ⚠️  Frontend page incomplete (${pageChecks}/${checks.length} checks passed)`);
      allPassed = false;
    }
  }
  
  // Check API exists
  if (!fs.existsSync(apiPath)) {
    console.log(`   ❌ API route missing: ${apiPath}`);
    allPassed = false;
  } else {
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    
    // Verify API returns wrapped format
    if (apiContent.includes('success: true, products:')) {
      console.log(`   ✅ API returns wrapped format`);
    } else {
      console.log(`   ❌ API does not return wrapped format`);
      allPassed = false;
    }
  }
  
  console.log('');
});

console.log('═══════════════════════════════════════════════════════');
if (allPassed) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('All 8 categories are properly implemented with unified design.');
} else {
  console.log('⚠️  SOME CHECKS FAILED!');
  console.log('Please review the issues above.');
}
console.log('═══════════════════════════════════════════════════════');

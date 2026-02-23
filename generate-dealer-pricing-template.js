const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Generate Sample Excel Template for Dealer Product Pricing
 * This file can be downloaded by admin and filled with product pricing data
 */

function generateSampleExcel() {
  // Sample data structure based on the productfordealer folder analysis
  const sampleData = [
    {
      'Company': 'Hikvision',
      'Segment': 'IP Camera',
      'Model Number': 'DS-2CD1023G0-I',
      'Product Type': 'Bullet Camera',
      'Description': '2MP IR Fixed Network Bullet Camera',
      'Specifications': '1/2.7" Progressive Scan CMOS, 1920x1080, IR up to 30m',
      'Base Price': 3500.00,
      'Purchase %': -20.00,
      'Sale %': 14.29,
      'Stock Quantity': 50,
      'In Stock': 'Yes',
      'Active': 'Yes'
    },
    {
      'Company': 'Hikvision',
      'Segment': 'IP Camera',
      'Model Number': 'DS-2CD1343G0-I',
      'Product Type': 'Dome Camera',
      'Description': '4MP IR Fixed Dome Network Camera',
      'Specifications': '1/3" Progressive Scan CMOS, 2560x1440, IR up to 30m',
      'Base Price': 4200.00,
      'Purchase %': -19.05,
      'Sale %': 14.71,
      'Stock Quantity': 45,
      'In Stock': 'Yes',
      'Active': 'Yes'
    },
    {
      'Company': 'CP Plus',
      'Segment': 'HD Camera',
      'Model Number': 'CP-USC-TA13L2',
      'Product Type': 'Dome Camera',
      'Description': '1.3MP HD Dome Camera',
      'Specifications': '1/3" CMOS Sensor, 1280x960, IR up to 20m',
      'Base Price': 1200.00,
      'Purchase %': -35.00,
      'Sale %': 15.00,
      'Stock Quantity': 100,
      'In Stock': 'Yes',
      'Active': 'Yes'
    },
    {
      'Company': 'CP Plus',
      'Segment': 'HD Camera',
      'Model Number': 'CP-UVC-T1100L2',
      'Product Type': 'Bullet Camera',
      'Description': '1MP HD Bullet Camera',
      'Specifications': '1/4" CMOS Sensor, 1280x720, IR up to 20m',
      'Base Price': 1100.00,
      'Purchase %': -30.00,
      'Sale %': 12.00,
      'Stock Quantity': 80,
      'In Stock': 'Yes',
      'Active': 'Yes'
    },
    {
      'Company': 'Dahua',
      'Segment': 'IP Camera',
      'Model Number': 'DH-IPC-HFW1230S',
      'Product Type': 'Bullet Camera',
      'Description': '2MP IR Bullet Network Camera',
      'Specifications': '1/2.7" CMOS, 1920x1080, IR up to 30m',
      'Base Price': 3200.00,
      'Purchase %': -18.75,
      'Sale %': 15.38,
      'Stock Quantity': 60,
      'In Stock': 'Yes',
      'Active': 'Yes'
    },
    {
      'Company': 'Dahua',
      'Segment': 'NVR',
      'Model Number': 'NVR4104HS-P-4KS2',
      'Product Type': 'NVR',
      'Description': '4 Channel POE NVR',
      'Specifications': '4K Resolution, 4 POE Ports, 1 SATA',
      'Base Price': 6500.00,
      'Purchase %': -20.00,
      'Sale %': 15.38,
      'Stock Quantity': 30,
      'In Stock': 'Yes',
      'Active': 'Yes'
    },
    {
      'Company': 'Hikvision',
      'Segment': 'DVR',
      'Model Number': 'DS-7104HQHI-K1',
      'Product Type': 'DVR',
      'Description': '4 Channel Turbo HD DVR',
      'Specifications': '4MP Support, H.265+, 1 SATA',
      'Base Price': 4800.00,
      'Purchase %': -19.79,
      'Sale %': 14.29,
      'Stock Quantity': 40,
      'In Stock': 'Yes',
      'Active': 'Yes'
    },
    {
      'Company': 'CP Plus',
      'Segment': 'DVR',
      'Model Number': 'CP-UVR-0401E1-CS',
      'Product Type': 'DVR',
      'Description': '4 Channel HD DVR',
      'Specifications': '1080P Support, H.264, 1 SATA',
      'Base Price': 3500.00,
      'Purchase %': -30.00,
      'Sale %': 18.00,
      'Stock Quantity': 55,
      'In Stock': 'Yes',
      'Active': 'Yes'
    }
  ];

  // Instructions sheet
  const instructions = [
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '1. Company',
      '': 'Brand name (e.g., Hikvision, CP Plus, Dahua, etc.)'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '2. Segment',
      '': 'Product category (IP Camera, HD Camera, DVR, NVR, etc.)'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '3. Model Number',
      '': 'Unique model number - MUST BE UNIQUE (e.g., DS-2CD1023G0-I)'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '4. Product Type',
      '': 'Specific type (Bullet Camera, Dome Camera, PTZ, etc.)'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '5. Description',
      '': 'Brief product description'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '6. Specifications',
      '': 'Technical specifications'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '7. Base Price',
      '': 'MRP or list price (numbers only, no currency symbols)'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '8. Purchase %',
      '': 'Discount/markup from BASE price (e.g., -20 = 20% off base = dealer buys cheaper)'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '9. Sale %',
      '': 'Markup/discount from PURCHASE price (e.g., +15 = 15% markup = dealer sells higher)'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '10. Stock Quantity',
      '': 'Available stock (numbers only)'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '11. In Stock',
      '': 'Yes or No'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '12. Active',
      '': 'Yes or No (whether product should be visible to dealers)'
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': 'IMPORTANT NOTES:',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- Model Number must be unique for each product',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- Base Price should contain numbers only',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- Purchase % is usually negative (dealer buys at discount from base)',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- Sale % is usually positive (dealer sells at markup from purchase price)',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- Purchase Price = Base + (Base × Purchase%)',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- Sale Price = Purchase + (Purchase × Sale%) [NOT from base!]',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- Example: Base=1000, Purchase%=-20 gives 800, Sale%=+15 gives 920',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- Do not use currency symbols like ₹ or $',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- Stock Quantity should be a whole number',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- In Stock and Active fields should be "Yes" or "No"',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- If Model Number already exists, it will UPDATE the existing record',
      '': ''
    },
    {
      'INSTRUCTIONS FOR FILLING THIS EXCEL': '- If Model Number is new, it will CREATE a new record',
      '': ''
    }
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Add instructions sheet
  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Add sample data sheet
  const wsSampleData = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths for better readability
  const colWidths = [
    { wch: 15 },  // Company
    { wch: 15 },  // Segment
    { wch: 20 },  // Model Number
    { wch: 18 },  // Product Type
    { wch: 35 },  // Description
    { wch: 40 },  // Specifications
    { wch: 12 },  // Base Price
    { wch: 15 },  // Purchase %
    { wch: 12 },  // Sale %
    { wch: 15 },  // Stock Quantity
    { wch: 10 },  // In Stock
    { wch: 10 }   // Active
  ];
  wsSampleData['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, wsSampleData, 'Product Pricing Data');

  // Create empty template sheet
  const emptyTemplate = [
    {
      'Company': '',
      'Segment': '',
      'Model Number': '',
      'Product Type': '',
      'Description': '',
      'Specifications': '',
      'Base Price': '',
      'Purchase %': '',
      'Sale %': '',
      'Stock Quantity': '',
      'In Stock': '',
      'Active': ''
    }
  ];

  const wsEmptyTemplate = XLSX.utils.json_to_sheet(emptyTemplate);
  wsEmptyTemplate['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsEmptyTemplate, 'Empty Template');

  // Write to file
  const outputDir = path.join(__dirname, 'public', 'templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = 'dealer-product-pricing-template.xlsx';
  const filePath = path.join(outputDir, fileName);
  
  XLSX.writeFile(wb, filePath);
  
  console.log('✅ Sample Excel template generated successfully!');
  console.log(`📄 File: ${filePath}`);
  console.log('📊 Sheets: Instructions, Product Pricing Data, Empty Template');

  return filePath;
}

// Run the generator
if (require.main === module) {
  try {
    generateSampleExcel();
  } catch (error) {
    console.error('❌ Error generating Excel template:', error);
    process.exit(1);
  }
}

module.exports = { generateSampleExcel };

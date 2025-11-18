// Test the updated product parser
const { parseProductRuleBased } = require('./lib/ai/product-parser.ts');

// Test cases based on your examples
const testCases = [
  {
    name: 'OO2987 - BIO COM',
    brand: 'Biochemic',
    potency: '',
    form: 'Liquid'
  },
  {
    name: 'BC-6',
    brand: 'SBL', 
    potency: '',
    form: 'Liquid'
  },
  {
    name: 'BIO.COM 12',
    brand: 'SBL',
    potency: '',
    form: 'Liquid'
  },
  {
    name: 'Sulphur 200C',
    brand: 'Schwabe India',
    potency: '',
    form: 'Dilution'
  },
  {
    name: 'Calendula Q',
    brand: 'SBL',
    potency: '',
    form: 'Liquid'
  },
  {
    name: 'Five Phos Syrup',
    brand: 'SBL',
    potency: '',
    form: 'Syrup'
  }
];

console.log('Testing Updated Product Parser:\n');

testCases.forEach((testCase, index) => {
  const result = parseProductRuleBased(
    testCase.name,
    testCase.brand,
    testCase.potency,
    testCase.form
  );
  
  console.log(`${index + 1}. Input: ${testCase.name}`);
  console.log(`   Category: ${result.category}`);
  console.log(`   Potency: ${result.potency}`);
  console.log(`   Form: ${result.form}`);
  console.log(`   Brand: ${result.brand}`);
  console.log('');
});

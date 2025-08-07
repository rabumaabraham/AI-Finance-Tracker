// Database Category Normalization Script
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from './models/transaction.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

/**
 * Normalizes category names to ensure consistency (same as openrouterService.js)
 * @param {string} category - The raw category from database
 * @returns {string} - The normalized category name
 */
function normalizeCategory(category) {
  if (!category) return "Uncategorized";
  
  // Convert to lowercase and trim
  let cleanCategory = category.toLowerCase().trim();
  
  // Remove common prefixes and labels
  const prefixesToRemove = [
    /^(category|cat):\s*/i,
    /^(type|category type):\s*/i,
    /^(spending category|expense category):\s*/i,
    /^(transaction category|tx category):\s*/i,
    /^(the category is|category is):\s*/i,
    /^(this is|it's|it is):\s*/i,
    /^(classified as|categorized as):\s*/i
  ];
  
  // Remove all prefixes
  prefixesToRemove.forEach(prefix => {
    cleanCategory = cleanCategory.replace(prefix, '');
  });
  
  // Remove any remaining quotes, periods, or extra whitespace
  cleanCategory = cleanCategory.replace(/['"]/g, '').replace(/\.$/, '').trim();
  
  // Map variations to standard categories
  const categoryMap = {
    'food': 'Food',
    'food & dining': 'Food',
    'food and dining': 'Food',
    'dining': 'Food',
    'restaurant': 'Food',
    'groceries': 'Food',
    'transport': 'Transport',
    'transportation': 'Transport',
    'travel': 'Transport',
    'entertainment': 'Entertainment',
    'bills': 'Bills',
    'utilities': 'Bills',
    'salary': 'Salary',
    'income': 'Salary',
    'wages': 'Salary',
    'health': 'Health',
    'healthcare': 'Health',
    'medical': 'Health',
    'shopping': 'Shopping',
    'retail': 'Shopping',
    'other': 'Other',
    'uncategorized': 'Uncategorized',
    'unknown': 'Uncategorized'
  };
  
  // Return mapped category or capitalize first letter
  return categoryMap[cleanCategory] || cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1);
}

// Fix categories in database
const fixCategories = async () => {
  try {
    console.log('\n🔧 Starting category normalization...\n');
    
    // Get all unique categories before fixing
    const uniqueCategories = await Transaction.distinct('category');
    console.log('📋 Current unique categories in database:');
    uniqueCategories.forEach(cat => console.log(`  - "${cat}"`));
    
    // Get transactions with problematic categories
    const problematicCategories = uniqueCategories.filter(cat => 
      cat.toLowerCase().includes('category:') || 
      cat.toLowerCase().includes('cat:') ||
      cat.toLowerCase().includes('type:') ||
      cat.toLowerCase().includes('classified as') ||
      cat.toLowerCase().includes('categorized as') ||
      cat !== normalizeCategory(cat)
    );
    
    if (problematicCategories.length === 0) {
      console.log('\n✅ No problematic categories found!');
      return;
    }
    
    console.log('\n🔍 Found problematic categories:');
    problematicCategories.forEach(cat => console.log(`  - "${cat}"`));
    
    // Fix each problematic category
    let totalFixed = 0;
    
    for (const oldCategory of problematicCategories) {
      const newCategory = normalizeCategory(oldCategory);
      
      if (oldCategory !== newCategory) {
        const result = await Transaction.updateMany(
          { category: oldCategory },
          { category: newCategory }
        );
        
        console.log(`  ✅ Fixed "${oldCategory}" → "${newCategory}" (${result.modifiedCount} transactions)`);
        totalFixed += result.modifiedCount;
      }
    }
    
    console.log(`\n🎉 Total transactions fixed: ${totalFixed}`);
    
    // Show final unique categories
    const finalCategories = await Transaction.distinct('category');
    console.log('\n📋 Final unique categories:');
    finalCategories.forEach(cat => console.log(`  - "${cat}"`));
    
  } catch (error) {
    console.error('❌ Error fixing categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the fix
fixCategories();

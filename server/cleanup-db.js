// Database cleanup script to fix duplicate email issues
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    const db = conn.connection.db;
    
    // Step 1: Drop the problematic email index
    try {
      await db.collection('users').dropIndex('email_1');
      console.log('✅ Dropped email_1 index');
    } catch (error) {
      console.log('ℹ️ email_1 index not found or already dropped');
    }
    
    // Step 2: Remove users with null emails (if any exist)
    const deleteResult = await db.collection('users').deleteMany({ 
      $or: [
        { email: null },
        { email: { $exists: false } },
        { primaryEmail: null },
        { primaryEmail: { $exists: false } }
      ]
    });
    console.log(`✅ Removed ${deleteResult.deletedCount} invalid user records`);
    
    // Step 3: List current users
    const users = await db.collection('users').find({}).toArray();
    console.log(`\n📋 Current users in database: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || 'No Name'} - Email: ${user.primaryEmail || user.email || 'No Email'}`);
    });
    
    // Step 4: Recreate the email index properly
    try {
      await db.collection('users').createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          sparse: true,
          partialFilterExpression: { email: { $ne: null } }
        }
      );
      console.log('✅ Recreated email index with proper null handling');
    } catch (error) {
      console.log('ℹ️ Could not recreate email index:', error.message);
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database cleanup error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
};

connectDB();

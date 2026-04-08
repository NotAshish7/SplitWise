# How to View User Data in SplitWise

## 🔍 Where is User Data Stored?

Your user data is **NOT stored in Excel files**. Instead, it's stored in **MongoDB**, which is a NoSQL database.

### Storage Details:
- **Database Type:** MongoDB (NoSQL Database)
- **Database Name:** `smart-expense-manager`
- **Collection Name:** `users` (where user accounts are stored)
- **Connection String:** `mongodb://localhost:27017/smart-expense-manager`
- **Port:** 27017 (default MongoDB port)

## 📊 What User Data is Stored?

Based on the User model, the following data is stored for each user:

### Required Fields:
- ✅ **name** - User's full name
- ✅ **email** - User's email address (unique, used for login)
- ✅ **password_hash** - Hashed password (NOT plain text password - for security)

### Optional Fields:
- 📱 **phone** - Phone number (if provided)
- 🎨 **avatar** - Avatar image URL
- 🖼️ **profile_picture** - Profile picture URL
- 💰 **preferred_currency** - User's preferred currency (default: 'INR')
- 🎨 **theme** - UI theme preference ('light' or 'dark')
- 📐 **sidebar_collapsed** - Sidebar state preference
- ✅ **email_verified** - Whether email is verified (true/false)

### OAuth Fields (if logged in via Google/Facebook):
- 🔵 **google_id** - Google account ID (if using Google login)
- 📘 **facebook_id** - Facebook account ID (if using Facebook login)

### System Fields (Auto-generated):
- 📅 **created_at** - Account creation timestamp
- 📅 **updated_at** - Last update timestamp
- 🔐 **password_history** - Array of previous password hashes

## 🔐 Password Security

**IMPORTANT:** Passwords are **NOT stored in plain text**. They are hashed using `bcrypt` before storage. This means:
- ❌ You **cannot** see the original password
- ✅ This is a **security feature** - even you (as the developer) cannot see user passwords
- ✅ When users login, their password is hashed and compared with the stored hash

## 📥 How to View User Data

### Method 1: Using MongoDB Compass (Easiest - GUI)

1. **Download MongoDB Compass:**
   - Visit: https://www.mongodb.com/products/compass
   - Download and install the free version

2. **Connect to Your Database:**
   - Open MongoDB Compass
   - Connection String: `mongodb://localhost:27017`
   - Click "Connect"

3. **Navigate to Your Data:**
   - Click on database: `smart-expense-manager`
   - Click on collection: `users`
   - You'll see all user records in a table format

4. **View User Details:**
   - Click on any user document to see all fields
   - You can filter, sort, and search users

5. **Export to CSV/JSON (Optional):**
   - Select users you want to export
   - Click "Export Collection" button
   - Choose format (CSV or JSON)
   - Save the file

### Method 2: Using MongoDB Shell (Command Line)

1. **Open MongoDB Shell:**
   ```bash
   mongosh
   ```

2. **Connect to Database:**
   ```bash
   use smart-expense-manager
   ```

3. **View All Users:**
   ```bash
   db.users.find().pretty()
   ```

4. **Find Specific User:**
   ```bash
   db.users.findOne({ email: "user@example.com" })
   ```

5. **Count Total Users:**
   ```bash
   db.users.countDocuments()
   ```

6. **Export to JSON File:**
   ```bash
   mongoexport --db smart-expense-manager --collection users --out users.json --pretty
   ```

### Method 3: Using a Node.js Script (Programmatic)

I'll create a script for you to export user data:

```javascript
// File: backend/view-users.js
import mongoose from 'mongoose';
import User from './src/models/User.js';
import 'dotenv/config';

async function viewUsers() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-expense-manager';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('-password_hash -password_history').lean();
    
    console.log(`📊 Total Users: ${users.length}\n`);
    console.log('=' .repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone || 'Not provided'}`);
      console.log(`   Currency: ${user.preferred_currency}`);
      console.log(`   Theme: ${user.theme}`);
      console.log(`   Email Verified: ${user.email_verified ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
      if (user.google_id) console.log(`   Google ID: ${user.google_id}`);
      if (user.facebook_id) console.log(`   Facebook ID: ${user.facebook_id}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

viewUsers();
```

**To run this script:**
```bash
cd backend
node view-users.js
```

### Method 4: Export to Excel/CSV

I'll create a script to export users to Excel:

```javascript
// File: backend/export-users-to-excel.js
import mongoose from 'mongoose';
import User from './src/models/User.js';
import fs from 'fs';
import 'dotenv/config';

async function exportUsersToCSV() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-expense-manager';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users (excluding password hash)
    const users = await User.find({}).select('-password_hash -password_history').lean();
    
    // Create CSV header
    const headers = ['Name', 'Email', 'Phone', 'Currency', 'Theme', 'Email Verified', 'Created At', 'Updated At'];
    let csv = headers.join(',') + '\n';
    
    // Add user data rows
    users.forEach(user => {
      const row = [
        `"${user.name || ''}"`,
        `"${user.email || ''}"`,
        `"${user.phone || ''}"`,
        `"${user.preferred_currency || 'INR'}"`,
        `"${user.theme || 'light'}"`,
        user.email_verified ? 'Yes' : 'No',
        `"${user.created_at || ''}"`,
        `"${user.updated_at || ''}"`
      ];
      csv += row.join(',') + '\n';
    });
    
    // Write to file
    fs.writeFileSync('users-export.csv', csv);
    console.log(`✅ Exported ${users.length} users to users-export.csv`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

exportUsersToCSV();
```

## 🗂️ Other Collections in Database

Your database also contains these collections:

1. **users** - User accounts
2. **expenses** - Personal expenses
3. **groups** - Expense groups
4. **groupexpenses** - Group expenses
5. **payments** - Money transfers/payments
6. **notifications** - User notifications
7. **otps** - OTP codes (temporary, auto-deleted)

## 🔧 Checking Your MongoDB Connection

To verify your MongoDB is running and accessible:

1. **Check if MongoDB is running:**
   ```bash
   # Windows
   netstat -ano | findstr :27017
   
   # Linux/Mac
   lsof -i :27017
   ```

2. **Test connection from backend:**
   ```bash
   cd backend
   npm start
   ```
   Look for: `✅ MongoDB Connected Successfully`

## 📝 Important Notes

1. **Passwords are hashed** - You cannot retrieve original passwords
2. **Database location** - If using default, database files are stored in MongoDB's data directory (usually `C:\data\db` on Windows)
3. **Backup** - Regularly backup your MongoDB database
4. **Privacy** - User data is sensitive; handle with care

## 🆘 Troubleshooting

### "Connection refused" error:
- MongoDB might not be running
- Start MongoDB service:
  ```bash
  # Windows (if installed as service)
  net start MongoDB
  
  # Or start manually
  mongod
  ```

### "Database not found":
- Database is created automatically when first user signs up
- Run your backend and create a test account

### Can't find MongoDB Compass:
- Download from: https://www.mongodb.com/products/compass
- It's free and provides a visual interface

## 📚 Summary

- **Storage:** MongoDB database (not Excel)
- **Database Name:** `smart-expense-manager`
- **Collection:** `users`
- **View Data:** Use MongoDB Compass (easiest), MongoDB shell, or Node.js scripts
- **Export:** Can export to CSV/JSON/Excel using the scripts above
- **Security:** Passwords are hashed - cannot see original passwords

Would you like me to create the export scripts for you?

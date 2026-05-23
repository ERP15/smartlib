# SmartLib Database Setup

## Quick Start

### Step 1: Start XAMPP MySQL
1. Open XAMPP Control Panel
2. Click **Start** on MySQL

### Step 2: Access phpMyAdmin
- Go to: `http://localhost/phpmyadmin`

### Step 3: Import Database Schema

**Method 1: Via phpMyAdmin UI (Easiest)**
1. Click **Import** tab in phpMyAdmin
2. Click **Choose File** and select `schema.sql`
3. Click **Go** to execute

**Method 2: Via MySQL Command Line**
```bash
mysql -u root -p < schema.sql
```

### Step 4: Import Sample Data (Optional)
1. In phpMyAdmin, select the **smartlib** database
2. Click **Import** and select `sample_data.sql`
3. Click **Go**

---

## Database Structure

### Tables Created:
- ✅ **users** - Student, Librarian, Admin accounts
- ✅ **books** - Book inventory
- ✅ **borrow_records** - Borrowing history
- ✅ **recommendations** - Book recommendations
- ✅ **notifications** - User notifications (optional)
- ✅ **admin_logs** - Admin activity logs (optional)

### Key Features:
- Foreign key relationships
- Proper data types and constraints
- Indexes for performance
- Timestamps for tracking
- Status tracking for borrows

---

## Verify Setup

In phpMyAdmin:
1. Click on **smartlib** database
2. You should see all 6 tables listed
3. Check **Structure** tab to view columns

---

## Next Steps

Once the database is created:
1. Backend API Development (Phase 3)
2. Authentication System (Phase 4)
3. React Frontend (Phase 5)

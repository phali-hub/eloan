# eLoan Management System
> HTML + CSS + JavaScript frontend | Node.js + Express backend | MySQL database

---

## Project Structure

```
eloan/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── routes/
│   │   ├── auth.js            # Login, Register, Logout, Change Password
│   │   └── loans.js           # Loan CRUD, EMI, Payments, Admin
│   └── server.js              # Express app entry point
├── database/
│   └── schema.sql             # MySQL schema + seed data
├── public/                    # Static frontend (served by Express)
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── api.js             # Fetch wrapper
│   │   └── app.js             # SPA router + all page logic
│   └── index.html
├── package.json
└── README.md
```

---

## Step-by-Step Setup (Windows + VS Code)

### STEP 1 — Install Prerequisites

1. **Node.js** (v18+): https://nodejs.org → Download LTS → Install
2. **MySQL 9.2**: https://dev.mysql.com/downloads/installer/
   - During setup, choose "Server Only" or "Full"
   - Set a root password (remember it!)
3. Restart VS Code after installing Node.js

---

### STEP 2 — Set Up the Database

Open **MySQL Command Line Client 9.2** from Start Menu:

```sql
-- You'll be prompted for your root password
-- Then run these commands one by one:

SOURCE C:/path/to/eloan/database/schema.sql;
-- (Replace with the actual path to your schema.sql file)

-- OR paste the SQL manually:
CREATE DATABASE IF NOT EXISTS eloan_db;
USE eloan_db;
-- (then copy-paste the rest of schema.sql)
```

**To verify it worked:**
```sql
USE eloan_db;
SHOW TABLES;
SELECT * FROM loan_types;
```

---

### STEP 3 — Configure Database Connection

Open `backend/config/db.js` and update:

```js
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',        // ← your MySQL username
    password: 'YOUR_PASSWORD',  // ← your MySQL root password
    database: 'eloan_db',
    ...
});
```

---

### STEP 4 — Install Node Dependencies

Open VS Code terminal (`Ctrl + `` ` ``), navigate to the project folder:

```bash
cd C:\path\to\eloan
npm install
```

This installs: express, mysql2, bcryptjs, express-session, cors

---

### STEP 5 — Create Admin Account

Since the schema seeds an admin with a placeholder password hash,
run this in Node.js to get the correct hash:

Open a new terminal in VS Code and run:

```bash
node -e "const b=require('bcryptjs'); b.hash('admin123',10).then(h=>console.log(h))"
```

Copy the hash output, then in MySQL CLI:

```sql
USE eloan_db;
UPDATE users SET password_hash = 'PASTE_HASH_HERE' WHERE email = 'admin@eloan.com';
```

**Admin credentials:** `admin@eloan.com` / `admin123`

---

### STEP 6 — Run the Application

In VS Code terminal:

```bash
npm start
```

You should see:
```
✅ eLoan Server running at http://localhost:3000
```

Open your browser: **http://localhost:3000**

---

### STEP 7 — Using the App

**As Admin:**
- Login: `admin@eloan.com` / `admin123`
- Dashboard shows stats
- Manage loan types, customers, approve/reject loans, record payments

**As Customer:**
- Register a new account on the login page
- Apply for loans, calculate EMI, track status

---

## Development Mode (Auto-restart)

```bash
npm run dev
```
(Uses nodemon — auto-restarts on file changes)

---

## Modules Implemented

| Module | Location |
|--------|----------|
| Customer Registration | Register page |
| Customer Login | Login page |
| Home / Dashboard | After login |
| Apply Loan | Apply for Loan page |
| View Loan Status | My Loans page |
| EMI Calculation | EMI Calculator page |
| Change Password | Change Password page |
| User Master | Admin → Customers |
| Loan Type Master | Admin → Loan Types |
| Loan Master | Admin → All Loans |
| Receive Payment | Admin → Payments |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm` not found | Restart VS Code after installing Node.js |
| MySQL connection error | Check password in `backend/config/db.js` |
| Port 3000 in use | Change `PORT = 3000` in `server.js` |
| Schema import fails | Use full path in SOURCE command or paste SQL manually |
| `Cannot find module` | Run `npm install` again |

---

## Tech Stack (No JSP/Java)

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Single Page App)
- **Backend**: Node.js + Express.js
- **Database**: MySQL 9.2
- **Auth**: express-session + bcryptjs password hashing
- **Fonts**: Cormorant Garamond + DM Sans (Google Fonts)

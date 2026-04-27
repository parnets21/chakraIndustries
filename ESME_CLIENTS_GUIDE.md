# ESME Clients Page - Complete Guide

## URL
`http://localhost:5173/bulk/clientsesme`

## How to Use - Step by Step

### Step 1: Open the Page
- Navigate to `http://localhost:5173/bulk/clientsesme`
- You will see 4 KPI cards at the top showing:
  - Total ESME Clients (red)
  - Active Accounts (green)
  - Total Credit Limit (orange)
  - Outstanding Amount (purple)

### Step 2: View Existing Clients
- Below the KPI cards, you'll see a table with 5 sample ESME clients
- The table shows:
  - Client ID (e.g., ESME-001)
  - Company Name
  - Contact Person
  - Phone Number
  - Email
  - City
  - Category (Manufacturing, Trading, Distributor, Retailer)
  - Credit Limit (in Indian currency format)
  - Outstanding Amount
  - Status (Active/Inactive)
  - Action buttons (View & Quote)

### Step 3: Add a New ESME Client
1. Click the red button **"+ Add ESME Client"** in the top right
2. A modal form will open with the title "Add ESME Client"

### Step 4: Fill the Form (Required Fields marked with *)
Fill in the following fields:

**Required Fields (must fill):**
- **Company Name** - e.g., "Precision Auto Parts"
- **Contact Person** - Full name of the contact
- **Phone** - 10-digit mobile number
- **City** - City name

**Optional Fields:**
- **Email** - Email address
- **Category** - Select from: Manufacturing, Trading, Distributor, Retailer
- **Credit Limit** - Amount in rupees (e.g., 500000)
- **GST Number** - GST registration number
- **Address** - Full address

### Step 5: Save the Client
1. After filling all required fields, click the **"✓ Save Client"** button
2. You will see a success message: **"✅ ESME client added successfully!"**
3. The modal will close automatically

### Step 6: View the New Client in Table
- The new client will appear at the bottom of the table
- It will have:
  - Auto-generated ID (ESME-006, ESME-007, etc.)
  - All the data you entered
  - Status: Active
  - Outstanding: ₹0
  - Credit Limit formatted in Indian currency (e.g., ₹5,00,000)

### Step 7: Interact with Clients
For each client in the table, you can:
- **View** - Click "View" button to see client details
- **Quote** - Click "Quote" button to create a quotation for that client

## Example Data Entry

**Fill the form like this:**
- Company Name: `ABC Manufacturing Ltd`
- Contact Person: `Rajesh Kumar`
- Phone: `9876543210`
- Email: `rajesh@abcmfg.com`
- City: `Mumbai`
- Category: `Manufacturing`
- Credit Limit: `750000`
- GST Number: `18AABCT1234H1Z0`
- Address: `Plot 456, Industrial Zone, Mumbai`

**After clicking Save:**
- New client appears in table as ESME-006
- Shows all entered data
- Credit Limit displays as ₹7,50,000
- Status shows as Active
- Outstanding shows as ₹0

## Important Notes

1. **Phone Field** - Limited to 10 digits only
2. **Credit Limit Format** - Enter as number (e.g., 500000 for ₹5,00,000)
3. **Required Fields** - If you skip any required field, you'll see error: "❌ Please fill all required fields"
4. **Auto-ID Generation** - Each new client gets a unique ID automatically
5. **Data Persistence** - Data is stored in the component state (will reset on page refresh)
6. **Search** - Use the search box in the table to find clients by any field
7. **Pagination** - Table shows 8 records per page with navigation buttons

## Table Columns Explained

| Column | Description |
|--------|-------------|
| Client ID | Unique identifier (ESME-001, ESME-002, etc.) |
| Company Name | Business name |
| Contact Person | Primary contact name |
| Phone | Contact phone number |
| Email | Contact email address |
| City | Location city |
| Category | Business type (blue badge) |
| Credit Limit | Maximum credit allowed |
| Outstanding | Current outstanding amount |
| Status | Active or Inactive |
| Actions | View and Quote buttons |

## Color Coding

- **Red** - Client ID, Primary buttons, Important data
- **Green** - Outstanding ₹0 (no dues)
- **Red** - Outstanding amount (has dues)
- **Blue** - Category badges, Email links
- **Gray** - Regular text fields

## Troubleshooting

**Issue: Form won't submit**
- Solution: Make sure all 4 required fields are filled (Company Name, Contact Person, Phone, City)

**Issue: Data not appearing in table**
- Solution: Check if you clicked "Save Client" button and saw the success message

**Issue: Phone field won't accept more than 10 digits**
- Solution: This is intentional - Indian phone numbers are 10 digits

**Issue: Credit Limit showing as ₹0**
- Solution: You left the Credit Limit field empty - it's optional but shows ₹0 if blank

## Features

✅ Add new ESME clients with complete information
✅ Auto-generate unique client IDs
✅ Format currency in Indian format (₹X,XX,XXX)
✅ Search clients by any field
✅ View client details
✅ Create quotations for clients
✅ Track outstanding amounts
✅ Categorize clients by type
✅ Real-time data updates
✅ Success notifications
✅ Form validation


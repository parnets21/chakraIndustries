# Vendor Form Validation Guide

## Field Requirements & Formats

### Phone Number
- **Format**: 10 digits only
- **Example**: `9876543210`
- **Invalid**: `+91 9876543210`, `98-7654-3210`

### GST Number (GSTIN)
- **Format**: 15 characters exactly
- **Pattern**: `2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric`
- **Example**: `27AABCT1234H1Z0`
- **Breakdown**:
  - `27` = State code (2 digits)
  - `AABCT` = PAN (5 letters)
  - `1234` = Sequential number (4 digits)
  - `H` = Entity type (1 letter)
  - `1` = Checksum (1 alphanumeric)
  - `Z` = Literal Z (always Z)
  - `0` = Check digit (1 alphanumeric)

### Pincode
- **Format**: 6 digits only
- **Example**: `560001`
- **Invalid**: `560-001`, `56000`

### Email
- **Format**: Standard email format
- **Example**: `vendor@company.com`
- **Invalid**: `vendor@`, `@company.com`

## Success & Error Alerts

### Success Alert
- ✓ Vendor created successfully!
- ✓ Vendor updated successfully!

### Error Alerts
- ❌ Phone must be 10 digits
- ❌ Invalid GST format - must be 15 characters...
- ❌ Pincode must be 6 digits
- ❌ Invalid email format

## Tips
1. All required fields are marked with *
2. Validation happens both on client-side (before submit) and server-side
3. Error messages appear inline under each field in red
4. Fix all errors before clicking "Save Vendor"

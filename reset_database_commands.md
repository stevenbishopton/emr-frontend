# EMR Database Reset & Setup Commands

## 🚨 WARNING: These commands will DELETE ALL data from your EMR database!
## Use with extreme caution - this is a complete database reset!

## 1. Login to get authentication token
```bash
# Replace with your admin credentials
curl -X POST http://localhost:8080/emr/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_admin_password"
  }' \
  -c cookies.txt
```

## 2. Extract token from cookies
```bash
# Extract the JWT token from the response cookies
TOKEN=$(grep -o '"token":"[^"]*' cookies.txt | cut -d'"' -f4)
echo "Token: $TOKEN"
```

## 3. Delete all data from database
```bash
# Delete all patients
curl -X DELETE http://localhost:8080/emr/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Delete all visits
curl -X DELETE http://localhost:8080/emr/visits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Delete all bills
curl -X DELETE http://localhost:8080/emr/bills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Delete all patient department bills
curl -X DELETE http://localhost:8080/emr/patient-dept-bills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Delete all prescriptions
curl -X DELETE http://localhost:8080/emr/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Delete all lab results
curl -X DELETE http://localhost:8080/emr/lab-results \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Delete all radiographs
curl -X DELETE http://localhost:8080/emr/radiographs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Delete all admissions
curl -X DELETE http://localhost:8080/emr/admissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## 4. Create a new department
```bash
# Create a new department (e.g., "Emergency")
curl -X POST http://localhost:8080/emr/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emergency",
    "description": "Emergency Department",
    "location": "Ground Floor, Wing A",
    "isActive": true
  }'
```

## 5. Create a new personnel/user
```bash
# Create a new personnel (doctor/nurse/etc.)
curl -X POST http://localhost:8080/emr/personnel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@hospital.com",
    "username": "johndoe",
    "password": "newSecurePassword123",
    "phoneNumber": "+1234567890",
    "role": "ROLE_DOCTOR",
    "department": {
      "id": 1,
      "name": "Emergency"
    },
    "isActive": true,
    "licenseNumber": "DOC123456",
    "specialization": "General Medicine"
  }'

# Alternative: Create admin user
curl -X POST http://localhost:8080/emr/personnel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@hospital.com",
    "username": "adminuser",
    "password": "adminSecurePassword123",
    "phoneNumber": "+1234567890",
    "role": "ROLE_ADMIN",
    "department": {
      "id": 1,
      "name": "Administration"
    },
    "isActive": true
  }'
```

## 6. Verify new user can login
```bash
# Test login with new user credentials
curl -X POST http://localhost:8080/emr/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "newSecurePassword123"
  }'
```

## 📝 Notes:
- Replace `your_admin_password` with actual admin password
- The department ID in personnel creation should match the created department
- Available roles: `ROLE_ADMIN`, `ROLE_DOCTOR`, `ROLE_NURSE`, `ROLE_RECEPTIONIST`, `ROLE_PHARMACIST`, `ROLE_LAB_PERSONNEL`
- Make sure to run these commands in order
- The database will be completely wiped - backup first if needed!

## ⚠️ Alternative: One-liner reset
```bash
# Complete reset script (run all commands in sequence)
./reset_emr_database.sh
```

Create this script file to automate all commands:
```bash
#!/bin/bash
# reset_emr_database.sh
echo "🚨 WARNING: This will delete ALL EMR database data!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "🔐 Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:8080/emr/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_admin_password"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "🗑️ Deleting all data..."
curl -s -X DELETE http://localhost:8080/emr/patients -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE http://localhost:8080/emr/visits -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE http://localhost:8080/emr/bills -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE http://localhost:8080/emr/patient-dept-bills -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE http://localhost:8080/emr/prescriptions -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE http://localhost:8080/emr/lab-results -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE http://localhost:8080/emr/radiographs -H "Authorization: Bearer $TOKEN"
curl -s -X DELETE http://localhost:8080/emr/admissions -H "Authorization: Bearer $TOKEN"

echo "🏥 Creating new department..."
curl -s -X POST http://localhost:8080/emr/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emergency",
    "description": "Emergency Department",
    "location": "Ground Floor, Wing A",
    "isActive": true
  }'

echo "👤 Creating new personnel..."
curl -s -X POST http://localhost:8080/emr/personnel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@hospital.com",
    "username": "johndoe",
    "password": "newSecurePassword123",
    "phoneNumber": "+1234567890",
    "role": "ROLE_DOCTOR",
    "department": {
      "id": 1,
      "name": "Emergency"
    },
    "isActive": true,
    "licenseNumber": "DOC123456",
    "specialization": "General Medicine"
  }'

echo "✅ Database reset complete!"
echo "🔑 New login credentials:"
echo "Username: johndoe"
echo "Password: newSecurePassword123"
echo "Role: ROLE_DOCTOR"
```

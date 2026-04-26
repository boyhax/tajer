# Security Specification for Kuzama eCommerce

## 1. Data Invariants
- A User profile can only be created by the owner.
- An Order must belong to the authenticated user creating it.
- Only Admins can modify the 'role' or 'roles' fields in a User profile.
- A WishlistItem must belong to the user who created it.
- Notifications can only be read by the designated recipient.
- Products, Categories, and Tags can only be modified by Admins.
- Stores and Drivers require Admin verification before certain actions, but for now, we assume simple Admin management.

## 2. The "Dirty Dozen" Payloads

### P1: Identity Spoofing (Order)
**Action:** Create Order
**Payload:** `{ "userId": "victim_uid", "totalAmount": 100, ... }`
**Expected Result:** `PERMISSION_DENIED` (auth.uid does not match userId)

### P2: Identity Spoofing (Wishlist)
**Action:** Create Wishlist Item
**Payload:** `{ "userId": "victim_uid", "productId": "prod123" }`
**Expected Result:** `PERMISSION_DENIED`

### P3: Privilege Escalation (User Role)
**Action:** Update User
**Payload:** `{ "role": "admin", "roles": ["admin"] }`
**Expected Result:** `PERMISSION_DENIED` (Non-admin cannot change roles)

### P4: State Shortcutting (Order Status)
**Action:** Create/Update Order
**Payload:** `{ "status": "delivered", ... }`
**Expected Result:** `PERMISSION_DENIED` (Users can only create 'pending' orders)

### P5: Unauthorized Read (Other's Orders)
**Action:** Get Order `order_of_user_B`
**Expected Result:** `PERMISSION_DENIED` (User A cannot read User B's order)

### P6: Unauthorized Collection Listing (Users)
**Action:** List `/users`
**Expected Result:** `PERMISSION_DENIED` (Non-admins cannot list all users)

### P7: ID Poisoning
**Action:** Create document with ID `"a".repeat(2000)`
**Expected Result:** `PERMISSION_DENIED` (ID exceeds size limits)

### P8: Shadow Field Injection
**Action:** Create Product
**Payload:** `{ "name": "Hack", "isVerified": true, "extraData": "..." }`
**Expected Result:** `PERMISSION_DENIED` (Non-admin cannot create products)

### P9: Resource Exhaustion (String Size)
**Action:** Update Profile
**Payload:** `{ "displayName": "a".repeat(1000000) }`
**Expected Result:** `PERMISSION_DENIED` (String size limit)

### P10: PII Leak (User Email)
**Action:** Get `/users/victim_uid`
**Expected Result:** `PERMISSION_DENIED` (Non-owner cannot read private profile)

### P11: Orphaned Write (Order without Items)
**Action:** Create Order
**Payload:** `{ "userId": "my_uid", "items": [], ... }`
**Expected Result:** `PERMISSION_DENIED` (Orders must have items)

### P12: Unauthenticated Write
**Action:** Create Order (without being logged in)
**Expected Result:** `PERMISSION_DENIED`

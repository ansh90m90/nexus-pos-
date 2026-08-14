# Security Specification for Firestore Security Rules

## 1. Data Invariants
1. **User Isolation**: A user can only read and write their own `/users/{userId}` profile where `userId == request.auth.uid`.
2. **Store Ownership (Master Gate)**: A store document at `/stores/{storeId}` can only be created or modified by its owner (`ownerId == request.auth.uid`).
3. **Subcollection Relational Guard**: Any item, customer, supplier, sale, receiving, expense, or cashup under `/stores/{storeId}/*` can only be read or modified by the authenticated store owner of `/stores/{storeId}`.
4. **ID and String Bound Enforcement**: All ID path parameters and document field strings are length-bounded to prevent Denial of Wallet attacks.
5. **No Orphaned Resources**: Sub-resources can only be created if the parent `/stores/{storeId}` exists and is owned by `request.auth.uid`.

## 2. The Dirty Dozen Attack Payloads
1. **Payload 1 (Identity Spoofing in User Profile)**: Attempting to create `/users/victim_user_id` with `request.auth.uid = attacker_id`. Result: MUST BE DENIED.
2. **Payload 2 (Ghost Field Injection)**: Creating a user with `isAdmin: true` or unauthorized schema keys. Result: MUST BE DENIED.
3. **Payload 3 (Store Hijacking)**: Attempting to update `ownerId` of `/stores/{storeId}` to another user. Result: MUST BE DENIED (ownerId is immutable).
4. **Payload 4 (Cross-Tenant Store Sub-resource Access)**: User B attempting to read `/stores/store_user_A/sales`. Result: MUST BE DENIED.
5. **Payload 5 (Cross-Tenant Write)**: User B attempting to add an item to `/stores/store_user_A/items`. Result: MUST BE DENIED.
6. **Payload 6 (Oversized ID / Denial of Wallet)**: Using a 10KB string for `{itemId}`. Result: MUST BE DENIED by `isValidId()`.
7. **Payload 7 (Oversized Payload Strings)**: Injecting a 2MB description string into an item. Result: MUST BE DENIED.
8. **Payload 8 (Negative Price / Quantity Tampering)**: Setting item `unit_price: "not_a_number"` or corrupted types. Result: MUST BE DENIED.
9. **Payload 9 (Unauthenticated Writes)**: Anonymous or unauthenticated write attempts without valid token. Result: MUST BE DENIED.
10. **Payload 10 (Sale Alteration after Completion)**: Non-owner attempting to void or modify completed sales. Result: MUST BE DENIED.
11. **Payload 11 (Unauthenticated List Query)**: Scanning all stores or users without owning them. Result: MUST BE DENIED.
12. **Payload 12 (Direct Root Manipulation)**: Writing to non-whitelisted paths like `/admins` or `/{document=**}`. Result: MUST BE DENIED by default catch-all.

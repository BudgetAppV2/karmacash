---
description: 
globs: 
alwaysApply: false
---
---
description: Standards for Firebase Interactions (Client-side & Functions)
globs:
  - src/services/firebase/**/*.js
  - functions/src/**/*.js
  - firestore.rules # Apply when editing rules file
  type: Auto Attached #
---
# Firebase Interaction Standards

- **Firestore Schemas:** Strictly adhere to the defined Firestore schemas. Pay close attention to required fields, data types, and **signed amounts**. See [B5.2].
  @file docs/B5.2_Collections_Schemas((ACTIVE)).md
- **Security Rules:** Remember that Firestore Security Rules are strict. Ensure client-side code only attempts valid operations and Cloud Functions have appropriate IAM permissions/context. See [B5.3]. Reference specific validation logic (e.g., `isValidTransactionAmount`, `categoryTypeMatchesTransaction`) documented in B5.2/B5.3.
- **UTC Dates:** All date/timestamps stored in Firestore must be UTC `Timestamp` objects or ISO 8601 strings convertible to UTC. See [B2.3].
- **Cloud Functions:** Ensure proper error handling, logging ([B4.4]), and idempotency where applicable. Reference `manageRecurringInstances` logic in [B4.3], [B6.2] for examples. The function uses logic from `B6.2_Recurring_Algorithm.md` and is defined in `B4.3_Backend_Functions.md`.
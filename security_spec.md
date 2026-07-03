# Security Specification & Test Plan

## 1. Data Invariants
- An `orgCharts/{chartId}` document must have an `ownerId` that strictly matches the authenticated user doing the write.
- An `orgCharts/{chartId}/nodes/{nodeId}` must belong to a valid `orgCharts/{chartId}` that matches the authenticated user's ID.
- Relationships and structural updates must not bypass type enforcement or add untracked "ghost" fields.
- `ownerId` is strictly immutable.
- `createdAt` is immutable.
- `updatedAt` is always the current server time upon an update.

## 2. Dirty Dozen Payloads
1. **Unauthenticated Read/Write**: Attempt unauthenticated request.
2. **Ghost field injection**: Provide valid fields + `isAdmin: true` during create/update.
3. **Identity Spoofing**: Attempt to create an `orgChart` with `ownerId` of another user.
4. **Relational Bypass**: Attempt to read/write `nodes` in another user's `orgChart`.
5. **Data Poisoning (Size limit)**: Pass a 2MB string for `name`.
6. **Data Poisoning (Type mismatch)**: Pass `title: false`.
7. **Privilege Escalation**: Attempt to change `ownerId` via update.
8. **Immutability Bypass**: Attempt to modify `createdAt` via update.
9. **Time Travel**: Provide a client-side timestamp for `updatedAt` rather than `request.time`.
10. **Path Injection**: Pass an oversized id string into `{chartId}` or `{nodeId}` (>128 chars).
11. **Total Array Guarding / Map Guarding**: Provide an oversized `customFields` object.
12. **Insecure query scraping**: Attempt to query `orgCharts` without specifying `where("ownerId", "==", request.auth.uid)`.

## 3. The Test Runner
A test runner would emulate operations with `firebase/rules-unit-testing`.

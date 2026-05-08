# Security Specification - Shkodra Politike

## Data Invariants
1. A News Item must have a duration between 3s and 60s.
2. `order` must be non-negative.
3. `mediaType` must be 'image' or 'video'.
4. `activeItemId` must correspond to a news item (optional but linkable).

## The Dirty Dozen Payloads
- **P1: Resource Poisoning (ID)** - Attempt to create a document with a 2KB ID.
- **P2: Resource Poisoning (Size)** - News item with 1MB headline string.
- **P3: Identity Spoofing** - Anonymous user attempting to update status.
- **P4: Type Confusion** - Setting `duration` to a string.
- **P5: Missing Required Field** - Creating NewsItem without `mediaUrl`.
- **P6: Invalid Enum** - Setting `mediaType` to 'gif'.
- **P7: Negative Order** - Setting `order` to -5.
- **P8: Unauthorized Delete** - Non-admin deleting NewsItem.
- **P9: State Hijack** - Overwriting `isPlaying` from a guest account.
- **P10: Immutable field update** - Changing `createdAt` after creation.
- **P11: Bulk Read Attack** - Attempting to list all items without proper filters (if restricted).
- **P12: Shadow Field** - Adding `isAdmin: true` to a news item object.

## Test Runner (Conceptual)
`firestore.rules.test.ts` will verify these payloads are rejected.
For now, implementing rules to address these.

# PRD-0017: Mobile Data Access Architecture Fix

## Introduction

The mobile app currently experiences permission errors because it attempts to use InstantDB client queries that require `auth.id` authentication, but mobile bypasses InstantDB auth and uses session cookies instead. This causes permission denials when the app tries to access user data.

## Goals

- Ensure mobile app uses session-based API routes for all data access
- Eliminate permission errors caused by missing `auth.id` on mobile
- Maintain consistent data access patterns between desktop and mobile
- Prevent mobile app crashes due to authentication context mismatches

## User Stories

- As a mobile user, I want to open the app without permission errors so that I can access my conversations and songs
- As a mobile user, I want my data to load properly so that I can continue where I left off
- As a mobile user, I want to create and manage songs without authentication issues

## Functional Requirements

1. **Mobile Data Access Pattern**: All mobile data access must go through `/api/mobile/*` routes using session cookies
2. **Conditional Query Execution**: InstantDB client queries must only run when `auth.id` is available
3. **Session-Based Authentication**: Mobile routes must validate session cookies instead of InstantDB auth
4. **Consistent Data Flow**: Desktop and mobile must use the same underlying data structures

## Non-Goals

- Changing the desktop authentication flow
- Modifying InstantDB permission rules
- Adding new authentication methods

## Technical Considerations

### Current Issues

1. **StudioClient.tsx**: Uses `db.useQuery` for `userSongsData` which requires `auth.id`
2. **Library Page**: Uses `useLibrarySongs` and `useLibraryConversations` hooks that call `db.useQuery`
3. **Permission Rules**: All queries require `auth.id != null && auth.id == data.ref('user.id')`
4. **Mobile Auth**: Uses session cookies, not InstantDB auth, so `auth.id` is null

### Required Changes

1. **Conditional Queries**: Modify all `db.useQuery` calls to only execute when user is authenticated
2. **Mobile API Routes**: Ensure all mobile data access uses existing `/api/mobile/*` routes
3. **Session Validation**: Mobile routes properly validate session cookies
4. **Data Consistency**: Ensure mobile and desktop use same data structures

## Design Considerations

### Mobile Data Access Flow

```
Mobile App → /api/mobile/* (session cookie) → Admin SDK → Database
Desktop App → db.useQuery (auth.id) → Client SDK → Database
```

### Query Safety Pattern

```typescript
// Before: Always runs query
const { data } = db.useQuery({ songs: { ... } });

// After: Only runs when authenticated
const { data } = db.useQuery(
  user?.user?.id ? { songs: { ... } } : {}
);
```

## Success Metrics

- Mobile app loads without permission errors
- All mobile data operations work correctly
- No regression in desktop functionality
- Consistent user experience across platforms

## Open Questions

- Should we create mobile-specific API routes for library data?
- How to handle real-time updates on mobile without InstantDB subscriptions?

## Implementation Plan

### Phase 1: Fix Immediate Issues
1. Fix `userSongsData` query in StudioClient.tsx (already done)
2. Fix library queries to be conditional on authentication
3. Test mobile app startup and basic functionality

### Phase 2: Verify Mobile API Coverage
1. Audit all mobile data access points
2. Ensure all required API routes exist
3. Test comprehensive mobile functionality

### Phase 3: Testing and Validation
1. Test mobile app on actual devices
2. Verify no permission errors in production logs
3. Confirm desktop functionality unchanged
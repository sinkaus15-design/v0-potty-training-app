# Multi-Child Support Implementation Guide

## Overview
This document outlines the changes made to support multiple children per account.

## Database Changes
- New `children` table created (see `scripts/005-add-multi-child-support.sql`)
- `bathroom_requests`, `rewards`, and `redeemed_rewards` tables now support `child_id` column
- Migration function provided to move existing profile data to children table

## Component Updates Needed

### Completed:
1. ✅ Types updated to support Child interface and optional child_id
2. ✅ Mode selector updated to show multiple children
3. ✅ Landing page enhanced with rewards/praise emphasis
4. ✅ TTS fixed - only triggers for potty/help requests
5. ✅ Activity tracker fixed - requests clear immediately on approve/deny
6. ✅ Rewards system verified - supports 3 custom rewards per child with images

### Still Needed:
1. Update child page (`app/child/page.tsx`) to accept `childId` query param
2. Update child interface component to use `child_id` for database operations
3. Update caregiver page to work with selected child
4. Update caregiver dashboard to filter by `child_id`
5. Update onboarding to create child in children table (in addition to profile for backward compatibility)
6. Update all database queries to use `child_id` when available, fall back to `profile_id`

## Implementation Notes

### Backward Compatibility
- The system maintains backward compatibility with the existing `profiles` table
- When `child_id` is available, use it; otherwise fall back to `profile_id`
- Mode selector shows children from `children` table if available, otherwise shows profile

### Child Selection
- Children are selected via query parameter: `/child?childId=<uuid>`
- Selected child ID should be stored in localStorage as fallback
- Caregiver dashboard should allow selecting which child to manage

### State Isolation
- Each child has completely independent:
  - Points (stored in `children.total_points`)
  - Rewards (filtered by `child_id`)
  - Bathroom requests (filtered by `child_id`)
  - Activity history (filtered by `child_id`)

## Next Steps
1. Run the database migration script
2. Update remaining pages to use `child_id`
3. Test multi-child functionality
4. Update onboarding to create children in the new table

# PRD-0016 Manual Testing Plan
## Async Background Song Generation - Concurrent Generation Management

### Test Environment Setup

**Prerequisites:**
- Local dev server running (`npm run dev`)
- Two browser profiles/sessions:
  - Session A: Free user (no `type` field or `type: 'free'`)
  - Session B: Premium user (`type: 'premium'` in InstantDB users table)

### Test Scenario 1: Free User - Single Concurrent Generation

**Steps:**
1. Login as free user (Session A)
2. Start a conversation in Studio
3. Complete conversation until readiness score ≥ 70%
4. Click "Genereer Lyrics" button
5. **Expected:** Song entity created, redirected to Library
6. **Expected:** Toast appears: "Je liedje wordt gegenereerd! ✨"
7. Immediately go back to Studio (without waiting)
8. Start another conversation
9. Complete second conversation
10. Click "Genereer Lyrics" on second conversation
11. **Expected:** Error toast appears: "Generatie limiet bereikt - Je hebt al een liedje in productie..."
12. **Expected:** NO redirect to Library
13. **Expected:** User can still continue chatting in Studio
14. Wait for first song to complete (status becomes 'ready')
15. Try generating lyrics for second conversation again
16. **Expected:** Now allowed, song creates successfully

**Pass Criteria:**
- ✅ Free user can only have 1 concurrent generation
- ✅ Appropriate toast message shown
- ✅ User can still chat even when at limit
- ✅ After completion, new generation is allowed

---

### Test Scenario 2: Premium User - Multiple Concurrent Generations

**Steps:**
1. Login as premium user (Session B)
2. Start 5 conversations simultaneously (open 5 Studio tabs)
3. Complete all 5 conversations to readiness score ≥ 70%
4. Generate lyrics for all 5 conversations in quick succession
5. **Expected:** All 5 succeed and redirect to Library
6. **Expected:** Library shows 5 songs with "generating_lyrics" status
7. Start a 6th conversation
8. Complete and try to generate lyrics
9. **Expected:** Error toast: "Generatie limiet bereikt - Je hebt al 5 liedjes in productie..."
10. **Expected:** Badge shows "5 concurrent generations"
11. Wait for 1 song to complete
12. Try generating lyrics for 6th conversation
13. **Expected:** Now allowed (4 generating + 1 new = 5 total)

**Pass Criteria:**
- ✅ Premium user can have 5 concurrent generations
- ✅ 6th attempt is blocked with appropriate message
- ✅ After one completes, new generation slot opens
- ✅ Library correctly displays all generation states

---

### Test Scenario 3: Mixed Status Handling

**Steps:**
1. Login as premium user
2. Create 3 songs in "generating_lyrics" state
3. Create 1 song in "ready" state (completed)
4. Create 1 song in "failed" state
5. **Expected:** Current count = 3 (only generating states)
6. **Expected:** Remaining slots = 2
7. Try to generate 2 more songs
8. **Expected:** Both succeed
9. Try to generate 1 more
10. **Expected:** Blocked (5 generating + 0 ready/failed)

**Pass Criteria:**
- ✅ Only counts songs with generating statuses
- ✅ Completed and failed songs don't count toward limit
- ✅ Limit calculation is accurate

---

### Test Scenario 4: Conversation Flow Not Blocked

**Steps:**
1. Login as free user
2. Start conversation, generate lyrics (hit limit)
3. While first song is generating:
   - **Test:** Start new conversation
   - **Expected:** ✅ Allowed
   - **Test:** Send messages in new conversation
   - **Expected:** ✅ Allowed
   - **Test:** Navigate to Library
   - **Expected:** ✅ Allowed
   - **Test:** Navigate back to Studio
   - **Expected:** ✅ Allowed
   - **Test:** Try to generate lyrics for new conversation
   - **Expected:** ❌ Blocked with toast

**Pass Criteria:**
- ✅ All app functionality works except lyrics generation
- ✅ User experience is not degraded
- ✅ Only generation is rate-limited, not conversations

---

### Test Scenario 5: Toast Message Content Verification

**Free User Toast (at limit):**
```
Title: "Generatie limiet bereikt"
Description: "Je hebt al een liedje in productie. Wacht tot deze klaar is of upgrade naar Premium voor meerdere gelijktijdige generaties! 🎵"
Variant: error
```

**Premium User Toast (at limit):**
```
Title: "Generatie limiet bereikt"
Description: "Je hebt al 5 liedjes in productie. Wacht tot er een klaar is om een nieuwe te starten."
Variant: error
```

**Success Toast (generation started):**
```
Title: "Je liedje wordt gegenereerd! ✨"
Description: "Je ontvangt een notificatie wanneer de lyrics klaar zijn."
Variant: success
```

**Pass Criteria:**
- ✅ Correct toast for free vs premium users
- ✅ Upgrade suggestion shown only to free users
- ✅ All emojis display correctly

---

### Test Scenario 6: Edge Cases

**Test 6.1: Rapid Fire Attempts**
1. Login as free user
2. Generate first song
3. Immediately spam-click "Genereer Lyrics" 5 times
4. **Expected:** Only 1 toast shown, no duplicate requests

**Test 6.2: Tab Switching**
1. Generate song in Tab 1
2. Switch to Tab 2 (same user session)
3. Try to generate in Tab 2
4. **Expected:** Blocked (same user, shared limit)

**Test 6.3: User Without Songs**
1. New user account (no songs yet)
2. Generate first song
3. **Expected:** ✅ Succeeds (0/1 or 0/5 used)

**Test 6.4: Null/Undefined Status**
1. Manually create song with `status: null` in DB
2. Try to generate new song
3. **Expected:** Null status ignored, generation allowed

**Pass Criteria:**
- ✅ No race conditions or duplicate generations
- ✅ Cross-tab limit enforcement works
- ✅ Handles edge cases gracefully

---

### Test Scenario 7: Environment Variable Configuration

**Test 7.1: Custom Free Limit**
1. Set `NEXT_PUBLIC_MAX_CONCURRENT_FREE=2`
2. Restart dev server
3. Login as free user
4. **Expected:** Can generate 2 songs concurrently

**Test 7.2: Custom Premium Limit**
1. Set `NEXT_PUBLIC_MAX_CONCURRENT_PREMIUM=10`
2. Restart dev server
3. Login as premium user
4. **Expected:** Can generate 10 songs concurrently

**Pass Criteria:**
- ✅ Environment variables properly override defaults
- ✅ No hard-coded limits in production code

---

## Automated Test Coverage

### Unit Tests (Already Created)
- ✅ `concurrentGenerations.test.ts` - 150+ lines
- ✅ `userTier.test.ts` - 90+ lines
- ✅ `concurrentGenerations.integration.test.ts` - 300+ lines

### Test Coverage Areas
- ✅ Counting generating songs
- ✅ Checking concurrent limits
- ✅ User tier detection
- ✅ Free vs Premium scenarios
- ✅ Edge cases (null, undefined, empty arrays)
- ✅ Real-world scenarios (queue management)

---

## Production Deployment Checklist

Before deploying PRD-0016 to production:

- [ ] All unit tests pass (`npm run test`)
- [ ] Manual tests completed for free user scenarios
- [ ] Manual tests completed for premium user scenarios
- [ ] Toast messages verified in UI
- [ ] Environment variables set on Vercel:
  - [ ] `NEXT_PUBLIC_MAX_CONCURRENT_FREE` (default: 1)
  - [ ] `NEXT_PUBLIC_MAX_CONCURRENT_PREMIUM` (default: 5)
- [ ] Library notification system tested (Task 4.0)
- [ ] Error handling verified (Task 5.0)
- [ ] E2E tests pass (Task 6.0)

---

## Notes for QA Team

**Key User Experience Points:**
1. Free users should see upgrade prompts when hitting limits
2. Premium users should see simple "wait" message (no upgrade prompt)
3. Users should NEVER be blocked from chatting, only from generating
4. Library should clearly show which songs are generating vs ready
5. Toast notifications should be non-intrusive but visible

**Common Issues to Watch:**
- Race conditions on rapid clicking
- Cross-tab synchronization
- Null/undefined status handling
- Webhook delays (songs staying in generating state)

**Performance Considerations:**
- InstantDB query overhead (fetching all user songs)
- Real-time updates in Library when songs complete
- Toast notification spam prevention

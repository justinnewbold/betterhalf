# Friends & Family Mode 👨‍👩‍👧‍👦

Complete documentation for the Better Half Friends & Family feature.

## Overview

Friends & Family Mode extends Better Half beyond romantic relationships, allowing users to play question games with friends and family members. The feature maintains complete privacy separation from couples data while providing the same engaging question-and-answer experience.

## Key Features

### 1. Invite System
- Generate unique 8-character invite codes
- Share via native share sheet or clipboard
- Links work on web and mobile: `https://betterhalf.newbold.cloud/invite/friend/{code}`
- Invites expire after 7 days for security
- Self-invite prevention

### 2. Relationship Types
| Type | Description |
|------|-------------|
| `friend` | General friendship (default) |
| `family` | Family member |
| `sibling` | Brother or sister |
| `parent` | Parent |
| `child` | Child |
| `cousin` | Cousin |
| `other` | Other relationship |

### 3. Daily Question Games
- Up to 10 questions per day per friendship (configurable: 5/10/15/20)
- Questions filtered by `for_friends` and `for_family` audience flags
- Romance 💕 and Spicy 🔥 categories automatically excluded
- Safe categories: Daily Life, Fun, History, Deep Talks, Custom

### 4. Privacy Features
- Complete table separation from couples data
- Row Level Security (RLS) policies
- No cross-table queries
- Partner answers never exposed to friends

## Database Schema

### betterhalf_friends Table

```sql
CREATE TABLE betterhalf_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES betterhalf_users(id),
  friend_id UUID REFERENCES betterhalf_users(id),
  nickname TEXT,                    -- Custom display name
  relationship_type TEXT NOT NULL DEFAULT 'friend',
  status TEXT NOT NULL DEFAULT 'pending',
  invite_code VARCHAR(8) UNIQUE,    -- For pending invites
  invite_expires_at TIMESTAMPTZ,
  preferred_categories JSONB DEFAULT '["daily_life", "fun", "history"]',
  daily_limit INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);
```

### betterhalf_friend_games Table

```sql
CREATE TABLE betterhalf_friend_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id UUID NOT NULL REFERENCES betterhalf_friends(id),
  question_id UUID NOT NULL REFERENCES betterhalf_questions(id),
  game_date DATE NOT NULL DEFAULT CURRENT_DATE,
  question_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting_initiator',
  initiator_answer INTEGER,
  friend_answer INTEGER,
  is_match BOOLEAN,
  initiator_answered_at TIMESTAMPTZ,
  friend_answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);
```

## Game Flow

### 1. Invite Flow
```
User A: Creates invite → Generates code → Shares link
User B: Opens link → Views invitation → Accepts
System: Creates friendship → Both users redirected to Friends tab
```

### 2. Game Play Flow
```
User opens friend game → System loads/creates today's questions
→ User selects answer → Answer saved
→ Waits for friend OR sees immediate result if friend already answered
→ Match celebration OR mismatch display
→ Next question or game complete
```

### 3. Answer Status States
| Status | Description |
|--------|-------------|
| `waiting_initiator` | Waiting for person who started friendship |
| `waiting_friend` | Waiting for person who accepted invite |
| `waiting_both` | Neither has answered yet |
| `completed` | Both answered, result calculated |
| `expired` | 24 hours passed without completion |
| `skipped` | Question was skipped |

## File Structure

```
app/(main)/friends/
├── index.tsx           # Friends list screen
├── [id].tsx            # Friend profile/settings
├── play/
│   └── [friendshipId].tsx  # Game play screen
├── results/
│   └── [gameId].tsx    # Single game result
└── history/
    └── [friendshipId].tsx  # Game history with friend

app/invite/friend/
└── [code].tsx          # Deep link handler

lib/
├── friendGameService.ts      # Game logic
└── friendRealtimeService.ts  # Real-time subscriptions

stores/
└── friendsStore.ts     # Zustand state management

hooks/
└── useFriendRealtime.ts  # Real-time React hooks

components/
└── AddFriendModal.tsx  # Invite creation modal
```

## API Reference

### friendGameService.ts

```typescript
// Get or create today's games for a friendship
getOrCreateTodaysGames(friendshipId: string): Promise<FriendGame[]>

// Submit an answer
submitAnswer(gameId: string, answer: number, isInitiator: boolean): Promise<FriendGame>

// Get daily progress
getDailyProgress(friendshipId: string): Promise<{ completed: number, total: number }>

// Get next unanswered game
getNextUnansweredGame(friendshipId: string): Promise<FriendGame | null>
```

### friendsStore.ts

```typescript
// State
friends: Friend[]
pendingRequests: Friend[]
isLoading: boolean
error: string | null

// Actions
fetchFriends(): Promise<void>
createFriendInvite(relationshipType: string): Promise<string>
acceptFriendInvite(inviteCode: string): Promise<void>
updateFriendSettings(friendshipId: string, settings: Partial<Friend>): Promise<void>
removeFriend(friendshipId: string): Promise<void>
blockFriend(friendshipId: string): Promise<void>
getPendingGamesCount(): number
```

## Question Filtering

Questions are filtered using audience flags:

```typescript
// In lib/supabase.ts
const FRIEND_SAFE_CATEGORIES = ['daily_life', 'history', 'fun', 'deep_talks', 'custom'];
const FAMILY_SAFE_CATEGORIES = ['daily_life', 'history', 'fun', 'deep_talks', 'custom'];

// Questions query filters by:
// - for_friends = true (for friend relationships)
// - for_family = true (for family relationships)
// - category IN (friendship's preferred_categories)
```

## Real-Time Updates

### Subscriptions

```typescript
// Subscribe to a specific game
useFriendGameUpdates(gameId: string, onUpdate: (game: FriendGame) => void)

// Subscribe to all friend games
useAllFriendGameUpdates(onUpdate: () => void)

// Track friend presence/activity
useFriendActivity(friendId: string)
```

## Settings & Customization

Each friendship can be customized with:

| Setting | Options | Default |
|---------|---------|---------|
| Nickname | Any text | Friend's display name |
| Relationship Type | friend, family, sibling, etc. | friend |
| Categories | daily_life, fun, history, deep_talks, custom | daily_life, fun, history |
| Daily Limit | 5, 10, 15, 20 | 10 |

## Security Considerations

1. **RLS Policies**: All queries filtered by user_id
2. **Invite Expiration**: 7-day limit prevents stale invites
3. **Self-Invite Prevention**: Cannot accept your own invite
4. **Data Isolation**: No foreign keys between couples and friends tables
5. **Audience Filtering**: Inappropriate questions filtered at query level

## Troubleshooting

### Common Issues

**Invite not working:**
- Check if invite code is expired (7 days)
- Verify the link format is correct
- Ensure user is logged in

**Questions not appearing:**
- Check preferred_categories settings
- Verify questions exist with correct audience flags
- Check daily_limit hasn't been reached

**Real-time updates not working:**
- Verify Supabase real-time is enabled
- Check subscription cleanup on unmount
- Ensure proper channel naming

## Future Enhancements

- [ ] Group games (multiple friends at once)
- [ ] Friend suggestions based on contacts
- [ ] Achievement badges for friend games
- [ ] Friend leaderboards
- [ ] Voice message responses

# Better Half 💕

A couples relationship app that helps partners connect through daily question games and shared activities. Now with Friends & Family mode!

## 🌟 Features

### Couples Mode 👫
- **Daily Questions**: Answer fun questions together and see if you match
- **5 Categories**: Daily Life ☀️, Romance 💕, Deep Talks 💭, Spicy 🔥, Fun 🎉
- **Custom Questions**: Create your own questions for personalized games
- **Real-Time Sync**: See when your partner answers and get instant results
- **History**: Review past games and track your compatibility over time
- **Streaks**: Build daily streaks and celebrate milestones together

### Friends & Family Mode 👨‍👩‍👧‍👦 (NEW!)
Play question games with friends and family members - not just your romantic partner!

**Features:**
- **Invite Friends**: Generate unique invite links to connect with friends and family
- **Relationship Types**: Categorize connections as Friend, Family, Sibling, Parent, Child, or Cousin
- **Safe Categories**: Romance and Spicy questions are automatically excluded
- **10 Questions Daily**: Up to 10 questions per friendship per day (customizable)
- **Custom Nicknames**: Set personal nicknames for your connections
- **Privacy First**: Complete separation between couples data and friends data

## 📱 Platforms

- **Web**: [betterhalf.newbold.cloud](https://betterhalf.newbold.cloud)
- **iOS**: Coming soon (Expo/React Native)
- **Android**: Coming soon (Expo/React Native)

## 🛠 Tech Stack

- **Frontend**: React Native / Expo (cross-platform)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Deployment**: Vercel
- **State Management**: Zustand
- **Routing**: Expo Router

## 📂 Project Structure

```
app/
├── (auth)/              # Authentication screens
│   ├── login.tsx
│   └── signup.tsx
├── (main)/              # Main app screens (authenticated)
│   ├── (tabs)/          # Bottom tab navigation
│   │   ├── index.tsx    # Home screen
│   │   ├── friends.tsx  # Friends tab
│   │   └── settings.tsx # Settings tab
│   ├── friends/         # Friends feature screens
│   │   ├── index.tsx    # Friends list
│   │   ├── [id].tsx     # Friend settings/profile
│   │   ├── play/        # Game play
│   │   ├── results/     # Game results
│   │   └── history/     # Game history
│   ├── game.tsx         # Couples game screen
│   └── results.tsx      # Couples results screen
├── invite/              # Deep link handlers
│   ├── [code].tsx       # Partner invite
│   └── friend/[code].tsx # Friend invite

components/
├── AddFriendModal.tsx   # Friend invite modal
├── Avatar.tsx           # User avatar component
├── CategoryPicker.tsx   # Question category selector
└── ...

lib/
├── supabase.ts          # Supabase client & types
├── friendGameService.ts # Friend game logic
├── friendRealtimeService.ts # Real-time subscriptions
└── ...

stores/
├── gameStore.ts         # Couples game state
├── friendsStore.ts      # Friends state management
└── userStore.ts         # User/auth state

hooks/
├── useFriendRealtime.ts # Real-time friend updates
└── ...
```

## 🗄 Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `betterhalf_users` | User profiles and settings |
| `betterhalf_couples` | Partner relationships |
| `betterhalf_questions` | Question bank |
| `betterhalf_daily_sessions` | Couples game sessions |
| `betterhalf_custom_questions` | User-created questions |

### Friends Tables (NEW)

| Table | Description |
|-------|-------------|
| `betterhalf_friends` | Friend/family relationships |
| `betterhalf_friend_games` | Friend game sessions |

### Question Categories

| Category | Icon | Couples | Friends | Family |
|----------|------|---------|---------|--------|
| Daily Life | ☀️ | ✅ | ✅ | ✅ |
| Fun | 🎉 | ✅ | ✅ | ✅ |
| History | 📚 | ✅ | ✅ | ✅ |
| Deep Talks | 💭 | ✅ | ✅ | ✅ |
| Romance | 💕 | ✅ | ❌ | ❌ |
| Spicy | 🔥 | ✅ | ❌ | ❌ |
| Custom | ✨ | ✅ | ✅ | ✅ |

## 🔐 Privacy & Security

- **Row Level Security (RLS)**: All tables protected with user-specific policies
- **Couples/Friends Separation**: Complete isolation between couples and friends data
- **Audience Flags**: Questions filtered by `for_couples`, `for_friends`, `for_family` flags
- **Secure Invites**: 8-character codes with 7-day expiration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account

### Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/justinnewbold/betterhalf.git
cd betterhalf

# Install dependencies
npm install

# Start development server
npx expo start
```

### Deployment

The app auto-deploys to Vercel on push to `main` branch.

## 📋 Feature Roadmap

### Completed ✅
- [x] Core couples game functionality
- [x] Profile photos and editing
- [x] Question categories
- [x] Custom questions
- [x] Game history
- [x] Real-time partner sync
- [x] Friends & Family mode
- [x] Friend invite system
- [x] Friend game play
- [x] Friend game history

### Upcoming 🔜
- [ ] Streak rewards & badges
- [ ] Push notifications
- [ ] Dark mode
- [ ] Native app store release

## 📝 License

MIT License - see LICENSE file for details.

## 👨‍💻 Author

**Justin Newbold**
- GitHub: [@justinnewbold](https://github.com/justinnewbold)

---

Made with ❤️ for couples, friends, and families everywhere.

# Trello Lite — Next Improvements

## 🔴 High Priority (Bugs / Security)

### 1. Board Access Control Missing
**Problem:** Koi bhi user board ka URL directly type karke access kar sakta hai, chahe wo member ho ya na ho.
**Files:**
- `backend/src/controllers/board.controller.js` — `getSingleBoard` mein membership check nahi hai
- `frontend/src/pages/BoardPage.jsx` — unauthorized access pe redirect nahi hota

**Fix:**
```js
// board.controller.js — getSingleBoard mein add karo
const isMember = board.owner.equals(req.user._id) ||
  board.members.some(m => m.user.equals(req.user._id));
if (!isMember) return next(new ApiError(403, 'Access denied'));
```

---

### 2. handleDragEnd Stale Closure Bug
**Problem:** `BoardPage.jsx` mein `handleDragEnd` ka `useCallback` dependency array mein `boardRole` aur `user` missing hain — purani values use hoti hain drag ke waqt.
**File:** `frontend/src/pages/BoardPage.jsx`

**Current (galat):**
```js
}, [cards, columns, boardId, socket]);
```
**Sahi:**
```js
}, [cards, columns, boardId, socket, boardRole, user]);
```

---

### 3. Register Page Pe Koi Bhi Admin Ban Sakta Hai
**Problem:** `RegisterPage.jsx` mein role dropdown mein `admin` option available hai — koi bhi admin register kar sakta hai.
**File:** `frontend/src/pages/RegisterPage.jsx`

**Fix:** Register form mein sirf `developer` aur `project_manager` allow karo. `admin` role sirf manually DB se assign ho.

---

## 🟡 Medium Priority (Core Features Missing)

### 4. Notification System Wired Nahi Hai
**Problem:** `Notification` model, controller, `NotificationBell`, `NotificationDropdown` sab bane hue hain — lekin **koi bhi jagah notification create nahi hoti**. Card assign hone pe, due date pe, card move hone pe — kuch bhi trigger nahi hota.

**Files jo fix karni hain:**
- `backend/src/controllers/card.controller.js` — `updateCard` mein assignee change hone pe notification create karo
- `backend/src/sockets/board.socket.js` — `new_notification` socket event emit karo
- `frontend/src/store/notificationStore.js` — already ready hai

**Notification triggers jo add karne hain:**
| Event | Recipient | Message |
|---|---|---|
| Card assign | Assigned developer | "You were assigned to card X" |
| Card due date near (1 day) | Assignees | "Card X is due tomorrow" |
| Card moved | Assignees | "Card X was moved to column Y" |
| Card updated | Assignees | "Card X was updated by Z" |

---

### 5. ActivitySidebar Real-time Nahi Hai
**Problem:** Activity feed sirf page load pe fetch hoti hai. Jab koi card create/move/update karta hai tab sidebar live update nahi hota.
**File:** `frontend/src/components/Board/ActivitySidebar.jsx`

**Fix:** Socket listeners add karo jo naye activities ko prepend karein:
```js
// board.socket.js mein — card:update, card:move, card:create events pe
// activity create karke socket se broadcast karo
socket.to(boardId).emit('activity:new', { activity });
```

---

### 6. Developer "My Tasks" View Nahi Hai
**Problem:** Developer ko ek dedicated view chahiye jahan sirf uske assigned cards dikhein — across all boards. Abhi usse har board pe jaake dekhna padta hai.

**Files jo banana hai:**
- `frontend/src/pages/MyTasksPage.jsx` — naya page
- `backend/src/routes/card.routes.js` — `GET /cards/my-tasks` route add karo
- `backend/src/controllers/card.controller.js` — `getMyTasks` controller

**Backend query:**
```js
const cards = await Card.find({ assignees: req.user._id })
  .populate('board', 'name')
  .populate('column', 'name')
  .sort('dueDate');
```

---

### 7. Card Comments Nahi Hain
**Problem:** `Notification` model mein `BOARD_COMMENT` type hai, `canComment` permission bhi thi — lekin `Card` model mein `comments` field nahi hai aur `CardDetail` mein comment UI nahi hai.

**Files jo update karni hain:**
- `backend/src/models/Card.js` — `comments` array add karo
- `backend/src/controllers/card.controller.js` — `addComment` controller
- `backend/src/routes/card.routes.js` — `POST /:cardId/comments`
- `frontend/src/components/Card/CardDetail.jsx` — comment section UI

**Card model mein add karo:**
```js
comments: [{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}]
```

**Permissions:**
- Owner, Admin, Editor (developer) — comment kar sakte hain
- Viewer (client) — sirf dekh sakta hai

---

## 🟢 Low Priority (UX Improvements)

### 8. Board Member Management UI Nahi Hai
**Problem:** Owner board pe members add kar sakta hai (API ready hai — `POST /boards/:boardId/members`) lekin koi UI nahi hai.
**File:** `frontend/src/pages/DashboardPage.jsx` ya `frontend/src/pages/BoardPage.jsx`

**Fix:** BoardPage header mein "Manage Members" button add karo (sirf Project Manager ko dikhega) jo ek modal open kare jahan members add/remove kar sako.

---

### 9. Profile Page Nahi Hai
**Problem:** User apna avatar, username ya password change nahi kar sakta.

**Files jo banana hai:**
- `frontend/src/pages/ProfilePage.jsx`
- `backend/src/routes/auth.routes.js` — `PATCH /auth/profile` route
- `backend/src/controllers/auth.controller.js` — `updateProfile` controller

---

### 10. Dashboard Pe Overdue Tasks Summary Nahi Hai
**Problem:** Developer ya Project Manager ko dashboard pe pata nahi chalta ki kitne cards overdue hain.
**File:** `frontend/src/pages/DashboardPage.jsx`

**Fix:** Har workspace card ke neeche overdue count badge dikhao.

---

## Summary Table

| # | Feature | Priority | Frontend | Backend |
|---|---|---|---|---|
| 1 | Board access control | 🔴 High | ✅ Redirect | ✅ Membership check |
| 2 | handleDragEnd stale closure | 🔴 High | ✅ Fix deps | ❌ |
| 3 | Register role restriction | 🔴 High | ✅ Remove admin option | ❌ |
| 4 | Notification system wire up | 🟡 Medium | ✅ Already ready | ✅ Triggers add karo |
| 5 | ActivitySidebar real-time | 🟡 Medium | ✅ Socket listener | ✅ Emit activity |
| 6 | Developer My Tasks view | 🟡 Medium | ✅ New page | ✅ New route |
| 7 | Card comments | 🟡 Medium | ✅ UI in CardDetail | ✅ Model + route |
| 8 | Board member management UI | 🟢 Low | ✅ Modal in BoardPage | ❌ Already ready |
| 9 | Profile page | 🟢 Low | ✅ New page | ✅ New route |
| 10 | Overdue tasks summary | 🟢 Low | ✅ Dashboard badge | ❌ |

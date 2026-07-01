# Role-Based Access Control (RBAC) — Authority, Features & Permissions

Trello-lite application mein **4 major roles** hain. Har role ke paas specific permissions, features aur dashboard experience hoti hai. Saath hi poora interface **mobile-first responsive design** aur **standardized top-aligned layouts** par built hai.

---

## Quick Permissions Summary Table

| Feature / Action | Admin | Project Manager | Developer | Client |
| :--- | :---: | :---: | :---: | :---: |
| **Workspace create ("New Workspace" button)** | ✅ | ✅ | ❌ (Hidden) | ❌ (Hidden) |
| **Workspace edit / delete (Corner-aligned on mobile)** | ✅ | ✅ | ❌ | ❌ |
| **Invite members** | ✅ | ✅ | ❌ | ❌ |
| **Remove / role-change member** | ✅ | ✅ | ❌ | ❌ |
| **Board create / delete** | ✅ | ✅ | ❌ | ❌ |
| **Board star / unstar** | ✅ | ✅ | ✅ | ✅ |
| **Board settings edit** | ✅ | ✅ | ❌ | ❌ |
| **Column create / edit / delete** | ✅ | ✅ | ❌ | ❌ |
| **Card create / delete** | ✅ | ✅ | ❌ | ❌ |
| **Card edit (title, desc, labels, due)** | ✅ | ✅ | ✅ | ❌ |
| **Card drag-and-drop (move)** | ✅ | ✅ | ✅ | ❌ |
| **Task assignment** | ✅ | ✅ | ❌ | ❌ |
| **Mark card blocked / unblocked** | ✅ | ✅ | ✅ | ❌ |
| **Request review on card** | ✅ | ✅ | ✅ | ❌ |
| **Checklist items check/uncheck** | ✅ | ✅ | ✅ | ❌ |
| **Comments add** | ✅ | ✅ | ✅ | ❌ |
| **Comment reactions** | ✅ | ✅ | ✅ | ❌ |
| **Save card as template** | ✅ | ✅ | ❌ | ❌ |
| **File attach / delete** | ✅ | ✅ | ✅ | ❌ |
| **File view / download** | ✅ | ✅ | ✅ | ✅ |
| **Real-time Presence Tracking (`usePresence`)** | ✅ | ✅ | ✅ | ✅ |
| **Full PDF Report generate (Audit)** | ✅ | ✅ | ❌ | ❌ |
| **Client PDF Report generate (Sanitized)** | ✅ | ✅ | ❌ | ✅ |
| **Share report link** | ✅ | ✅ | ❌ | ✅ |
| **Analytics page access** | ✅ | ✅ | ❌ | ❌ |
| **My Tasks page** | ✅ | ✅ | ✅ | ❌ |
| **Notifications** | ✅ | ✅ | ✅ | ❌ |
| **Focus Mode (Work Queue)** | ❌ | ❌ | ✅ | ❌ |
| **User management (system roles)** | ✅ | ❌ | ❌ | ❌ |
| **Role-Aware Dashboard panel** | ✅ Admin Panel | ✅ PM Panel | ✅ Dev Panel | ✅ Client Panel |

---

## 1. 🔴 Admin (System Admin / Workspace Creator)

**Sabse highest authority waala role.** Iske paas poore system aur workspace ka complete control hota hai.

### Dashboard & Responsive UI
- Admin ko login karte hi **Admin Dashboard Panel** milta hai (Total Users, Workspaces, Boards, Role Distribution chart).
- **Mobile-Responsive Workspace Cards**: Small phone screens par **Settings** aur **Delete** buttons automatically card ke top-right corner par opposite to workspace title align ho jaate hain taaki primary buttons ("Invite Members", "Add Board") ka size distort na ho.
- **Standardized Top Alignment (`justify-start`)**: Dashboard aur sabhi admin panels (Reports, Analytics, User Management) top se start hote hain, jisse navigation ke dauran screen jump nahi karti.

### Workspace & Board Management
- Naya workspace **create, update, delete** kar sakte hain.
- Kisi bhi user ko email ke through **invite** kar sakte hain, roles change kar sakte hain, aur remove kar sakte hain.
- Boards **create, edit, delete, star/unstar** kar sakte hain.

### Reports & Analytics
- **Full PDF Audit Report** generate kar sakte hain (jisme raw dev logs, sprint velocity aur internal metrics hote hain).
- **Client-Safe Progress Report** generate kar sakte hain aur shareable link copy kar sakte hain.
- **Analytics & User Management Page** ka full administrative access.

---

## 2. 🟣 Project Manager (PM)

**Team lead aur delivery management role.** Iska focus projects, boards, aur team ko manage karne par hota hai.

### Dashboard & Delivery Health Panel
- PM ko **Delivery Health Panel** milta hai jisme Active Boards, Overdue cards, Upcoming Milestones (14 days), Blocked tasks, aur Pending Client Reviews dikhte hain.
- Mobile screens par responsive action bars aur clean card padding milta hai.

### Workspace & Board Management
- Naye workspaces aur boards **create** kar sakte hain.
- Team members ko invite, remove, aur unke roles modify kar sakte hain.
- Columns/lists create, reorder, aur delete kar sakte hain.

### Task Assignment & Reports
- **AssignTaskPage** se developers ko task assign kar sakte hain.
- **Reports Engine** se Full Performance Audit aur Client-Safe reports dono generate aur download kar sakte hain.

---

## 3. 🔵 Developer

**Execution aur performance role.** Ye tasks par actual kaam karte hain. Inka focus assigned work complete karna aur progress update karna hota hai.

### Dashboard & My Work Queue
- Developer ko **My Work Queue Panel** milta hai jisme `All`, `Blocked`, aur `Due Soon` tabs hote hain.
- **Focus Mode (Work Queue)** — Board page ke sidebar mein developer ka dedicated focused task panel.

### Task Updates & Real-Time Collaboration
- Assigned cards pe **description, checklist, labels, due dates** update kar sakte hain aur drag-and-drop se columns ke beech move kar sakte hain.
- Cards ko **blocked/unblocked** mark kar sakte hain, comments aur file attachments add/delete kar sakte hain.
- **Real-Time Presence (`usePresence`)**: Board par active doosre team members ko live dekh sakte hain.

### Restrictions (Kya nahi kar sakte)
- **"New Workspace" button completely hidden** hota hai (Desktop aur mobile dono par).
- Workspaces, boards, ya columns **create/delete nahi** kar sakte.
- **Full Performance Audit Reports** aur **Analytics page** access nahi kar sakte.

---

## 4. 🟢 Client

**Viewer aur approval role.** Inka kaam project progress monitor karna aur client-level summary reports check karna hai.

### Dashboard & Read-Only Access
- Client ko **My Review Hub Panel** milta hai jisme Shared Boards aur **Pending Approvals** (`reviewRequested: true`) dikhte hain.
- Workspace, boards, columns, aur cards ko **read-only mode** mein dekh sakte hain (koi editing ya move disabled hai).

### Sanitized Reports Engine
- **Client-Safe Progress Report** generate aur download kar sakte hain.
  - Internal developer discussions, raw velocity metrics, aur sensitive budget details **hidden** hote hain.
  - Sirf **high-level milestones** aur completed tasks dikhte hain.
- **Responsive Table & Cards**: Small mobile screens par report archive table horizontal scroll (`whitespace-nowrap`) aur responsive padding ke saath render hota hai.

### Restrictions (Kya nahi kar sakte)
- **"New Workspace" button hidden** hota hai.
- Koi bhi editing, drag-and-drop, comment add, ya file upload **nahi** kar sakte.
- **My Tasks**, **Analytics**, aur **Full Audit Reports** access nahi kar sakte.

---

## Role Color Coding & UI Badging

| Role | Badge Color | Icon |
| :--- | :--- | :--- |
| **Admin** | 🔴 Rose / Red | `shield_person` |
| **Project Manager** | 🟣 Violet / Purple | `manage_accounts` |
| **Developer** | 🔵 Indigo / Blue | `code` |
| **Client** | 🟢 Emerald / Green | `person_pin` |

---

## Feature Access Matrix (Detailed)

| Page / Feature | Admin | Project Manager | Developer | Client |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard** | ✅ Admin Panel | ✅ PM Panel | ✅ Dev Panel | ✅ Client Panel |
| **Board Page** | ✅ Full | ✅ Full | ✅ Limited | ✅ Read-only |
| **My Tasks Page** | ✅ | ✅ | ✅ | ❌ |
| **Analytics Page** | ✅ | ✅ | ❌ | ❌ |
| **Reports Page** | ✅ Full + Client | ✅ Full + Client | ❌ | ✅ Client only |
| **AssignTask Page** | ✅ | ✅ | ❌ | ❌ |
| **Profile Page** | ✅ | ✅ | ✅ | ✅ |
| **Notifications** | ✅ | ✅ | ✅ | ❌ |
| **Focus Mode** | ❌ | ❌ | ✅ | ❌ |
| **User Management** | ✅ | ❌ | ❌ | ❌ |
| **Workspace Settings Modal** | ✅ | ✅ | ❌ | ❌ |
| **Create Workspace button** | ✅ | ✅ | ❌ (Hidden) | ❌ (Hidden) |
| **Real-time Board Presence** | ✅ | ✅ | ✅ | ✅ |
| **Role-Aware Dashboard API** | `/dashboard/admin` | `/dashboard/project-manager` | `/dashboard/developer` | `/dashboard/client` |

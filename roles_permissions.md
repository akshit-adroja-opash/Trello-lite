# Role-Based Access Control (RBAC) — Authority, Features & Permissions

Trello-lite application mein **4 major roles** hain. Har role ke paas specific permissions, features aur dashboard experience hoti hai.

---

## Quick Permissions Summary Table

| Feature / Action | Admin | Project Manager | Developer | Client |
| :--- | :---: | :---: | :---: | :---: |
| **Workspace create** | ✅ | ✅ | ❌ | ❌ |
| **Workspace edit / delete** | ✅ | ✅ | ❌ | ❌ |
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
| **Full PDF Report generate** | ✅ | ✅ | ❌ | ❌ |
| **Client PDF Report generate** | ✅ | ✅ | ❌ | ✅ |
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

### Dashboard (First Screen)
Admin ko login karte hi apna **Admin Dashboard Panel** milta hai jisme dikhta hai:
- System-wide stats: Total Users, Workspaces, Boards, Cards
- System-wide Overdue count aur Blocked tasks count
- Pending client reviews count
- **Role Distribution chart** — kitne Admin / PM / Developer / Client users hain
- Recent workspaces list
- Quick links → Analytics, Reports, User Management

### Workspace Management
- Naya workspace **create** kar sakte hain
- Workspace ke **name, description** update kar sakte hain
- Workspace **delete** kar sakte hain
- Kisi bhi user ko email ke through workspace mein **invite** kar sakte hain
- Workspace members ke **roles badal** sakte hain
- Workspace se members ko **remove** kar sakte hain

### Board Management
- Boards **create** aur **delete** kar sakte hain
- Board ke **name aur background** update kar sakte hain
- Board members ko **add / remove / role-update** kar sakte hain
- Boards ko **star / unstar** kar sakte hain

### Column / List Control
- Columns/lists **create, edit, reorder, delete** kar sakte hain

### Card / Task Control
- Naye cards (tasks) **create** aur **delete** kar sakte hain
- Cards ko **edit** kar sakte hain — title, description, checklist, labels, due dates, priority
- Cards ko columns ke beech **drag-and-drop** se move kar sakte hain
- **Task assign** kar sakte hain (AssignTaskPage se)
- Cards ko **blocked / unblocked** mark kar sakte hain aur reason de sakte hain
- Card pe **review request** laga sakte hain
- **Comments** add aur comment pe **reactions** toggle kar sakte hain
- Cards ko **template** ki tarah save kar sakte hain
- Cards par **files (images, documents) attach** aur **delete** kar sakte hain (Videos allowed nahi)

### Reports & Analytics
- **Full PDF Report** generate aur download kar sakte hain (milestone audit, developer performance, complete metrics)
- **Client PDF Report** bhi generate kar sakte hain
- **Report share link** copy kar sakte hain
- **Analytics page** access kar sakte hain — workspace-level KPIs, workload distribution, status distribution, productivity timeline

### System Administration
- **User Management** — sabhi registered users ki list dekh sakte hain, system roles change kar sakte hain, users delete kar sakte hain
- **My Tasks** page access kar sakte hain

---

## 2. 🟣 Project Manager (PM)

**Team lead aur delivery management role.** Iska focus projects, boards, aur team ko manage karne par hota hai.

### Dashboard (First Screen)
PM ko **Delivery Health Panel** milta hai jisme dikhta hai:
- **Active Boards count**, Overdue cards count, Blocked tasks count, Pending reviews count
- **Upcoming Milestones** — agle 14 dinon mein due hone wale cards (ascending order)
- **Blocked Tasks** list — blockedReason ke saath
- **Pending Client Reviews** — cards jahan `reviewRequested: true` hai
- Quick links → Analytics, Reports

### Workspace Management
- Naya workspace **create** kar sakte hain
- Kisi bhi user ko workspace mein **invite** kar sakte hain
- Workspace **members ke roles badal** sakte hain
- Workspace **settings (Name, Description)** update kar sakte hain
- Managed workspaces ko **delete** kar sakte hain
- Workspace se members ko **remove** kar sakte hain

### Board Management
- Naye boards **create** aur **delete** kar sakte hain
- Board members ko **add / remove / role-update** kar sakte hain
- Board **settings (Name, Background)** modify kar sakte hain
- Boards ko **star / unstar** kar sakte hain

### Column / List Control
- Columns/lists **create, edit, reorder, delete** kar sakte hain

### Card / Task Control
- Naye cards **create** aur **delete** kar sakte hain
- Cards ko **edit aur rename** kar sakte hain
- Cards ko **drag-and-drop** karke move kar sakte hain
- **Task assign** kar sakte hain
- Cards ko **blocked / unblocked** mark kar sakte hain
- Card pe **review request** laga sakte hain
- **Comments** add kar sakte hain, **reactions** toggle kar sakte hain
- Cards ko **template** ki tarah save kar sakte hain
- Cards par **files attach** aur **delete** kar sakte hain

### Reports & Analytics
- **Full PDF Reports** generate aur download kar sakte hain (complete project and developer metrics)
- **Client PDF Report** generate kar sakte hain
- **Report share link** copy kar sakte hain
- **Analytics page** access kar sakte hain

### Assign Tasks
- **AssignTaskPage** ka use karke developers ko tasks assign kar sakte hain
- **My Tasks** page access kar sakte hain

---

## 3. 🔵 Developer

**Execution aur performance role.** Ye tasks par actual kaam karte hain. Inका focus assigned work complete karna aur progress update karna hota hai.

### Dashboard (First Screen)
Developer ko **My Work Queue Panel** milta hai jisme dikhta hai:
- **My Tasks count**, Blocked count, Due Soon (7 days) count, Overdue count
- **Tabbed Task List** — `All`, `Blocked`, `Due Soon` tabs se filter kar sakte hain
- Har task pe priority badge, board name, aur due date (overdue warning ke saath)
- **Blocked Items** detail list — blockedReason ke saath
- Quick link → My Tasks

### Task Updates & Movement
- Assigned cards ke **description, checklist items (check/uncheck), labels, aur due dates** update kar sakte hain
- Task ko ek column se dusre column mein **move** kar sakte hain (e.g., *Backlog* → *In Progress* → *Code Review*)
- Cards ko **blocked / unblocked** mark kar sakte hain
- Card pe **review request** laga sakte hain
- **Comments** write kar sakte hain aur comments pe **reactions** de sakte hain
- Cards par **files attach** aur **delete** kar sakte hain

### Boards
- Boards ko **star / unstar** kar sakte hain
- Apne sabhi assigned tasks ko **My Tasks** page par dekh sakte hain
- **Focus Mode (Work Queue)** — Board page ke sidebar mein developer ka dedicated focused task panel

### Restrictions (Kya nahi kar sakte)
- Naya workspace **create nahi** kar sakte
- Kisi new member ko **invite nahi** kar sakte
- Columns/lists ko **create, edit, reorder ya delete nahi** kar sakte
- Naye cards (tasks) **create ya delete nahi** kar sakte
- Cards ko **template ki tarah save nahi** kar sakte
- **Full Performance Reports** download ya access **nahi** kar sakte (Access Denied)
- **Analytics page** access **nahi** kar sakte
- **Comments** Client ke liye disabled hain, Developer ke liye enabled hain
- **Notifications** receive karte hain (e.g., jab koi task assign ho)

---

## 4. 🟢 Client

**Viewer aur approval role.** Inka kaam project progress monitor karna aur client-level summary reports check karna hai.

### Dashboard (First Screen)
Client ko **My Review Hub Panel** milta hai jisme dikhta hai:
- **My Workspaces count**, Shared Boards count, Pending Approvals count
- **Shared Boards list** — directly board par click karke ja sakte hain, last updated time ke saath
- **Pending Approvals** — cards jahan `reviewRequested: true` hai, priority badge ke saath
- Info note — "Items awaiting your review or sign-off from the team"

### Read-Only Access
- Workspace, boards, columns, aur cards ko **read-only mode** mein dekh sakte hain
- Boards ko **star / unstar** kar sakte hain (bookmarking ke liye)
- Files aur attachments ko **view / download** kar sakte hain

### Reports
- **Client Report** generate aur download kar sakte hain
  - Jisme developer performance metrics **hidden** hote hain
  - Sirf **client-safe milestones data** dikhta hai (project progress, completed tasks, overdue tasks)
- **Report share link** copy kar sakte hain

### Restrictions (Kya nahi kar sakte)
- Kisi bhi tarah ka **editing, creation, deletion** (workspace, board, column, card) **nahi** kar sakte
- Board par **comment add ya react nahi** kar sakte (comment input hidden hota hai)
- **Card ko move nahi** kar sakte (drag-and-drop disabled)
- Cards ko **template as save nahi** kar sakte
- Cards par **files upload ya delete nahi** kar sakte (sirf view/download)
- **My Tasks page access nahi** kar sakte
- **Analytics page access nahi** kar sakte
- **Notifications nahi** milti
- **Full PDF Reports access nahi** kar sakte
- **AssignTaskPage access nahi** kar sakte

---

## Role Color Coding (UI mein)

| Role | Badge Color | Icon |
| :--- | :--- | :--- |
| Admin | 🔴 Rose / Red | `shield_person` |
| Project Manager | 🟣 Violet / Purple | `manage_accounts` |
| Developer | 🔵 Indigo / Blue | `code` |
| Client | 🟢 Emerald / Green | `person_pin` |

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
| **Create Workspace button** | ✅ | ✅ | ❌ | ❌ |
| **Role-Aware Dashboard API** | `/dashboard/admin` | `/dashboard/project-manager` | `/dashboard/developer` | `/dashboard/client` |

# Role-Based Access Control (RBAC) Authority & Permissions

Trello-lite application mein **4 major roles** hain. Har role ke paas specific permissions aur control authorities hain.

### Permissions Summary Table

| Role | Workspace Edit/Delete | Board Management | Column/Card Create | Card Edit & Move | Comments & Reactions | Save Templates | Full PDF Report | Client Report |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Project Manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Developer** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Client** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 1. Admin (System Admin / Workspace Creator)
**Sabse highest authority waala role.** Iske paas poore system aur workspace ka complete control hota hai.

### permissions (Kya kya kar sakte hain):
* **Workspace Management**:
  * Naya workspace create kar sakte hain.
  * Workspace ke settings update aur delete kar sakte hain.
  * Kisi bhi user ko email ke through workspace mein invite kar sakte hain.
  * Workspace se members ko remove kar sakte hain aur unke roles badal sakte hain.
* **Board Management**:
  * Boards create aur delete kar sakte hain.
  * Board members ko add/remove/role-update kar sakte hain.
  * Boards ko star ya unstar kar sakte hain.
* **List / Column Control**:
  * Boards ke andar columns/lists create, edit, reorder, aur delete kar sakte hain.
* **Card Control**:
  * Naye tasks (cards) create aur delete kar sakte hain.
  * Cards ko update kar sakte hain (Title, Description, Checklist, Labels, Due Dates).
  * Task Assignee dashboard ka use karke tasks assign kar sakte hain (Lekin self-admin ko assign nahi kar sakte kyuki admin dropdown se hidden hota hai).
  * Cards ko columns ke beech mein move (drag-and-drop) kar sakte hain.
  * Comments add kar sakte hain, comment pe react kar sakte hain, aur cards ko as a template save kar sakte hain.
  * Cards pe files (images, documents) attach aur delete kar sakte hain (Videos are not allowed).
* **Reports**:
  * **Full PDF Reports** (milestone audit, developer performance summary aur metrics) generate aur download kar sakte hain.

---

## 2. Project Manager (PM)
**Workspace aur team lead role.** Iska focus projects aur boards ko manage karne par hota hai. Iske paas lagbhag Admin jaisi hi powers hoti hain.

### permissions (Kya kya kar sakte hain):
* **Workspace Management**:
  * Naya workspace create kar sakte hain.
  * Kisi bhi user ko workspace mein invite kar sakte hain.
  * Workspace members ke roles badal sakte hain.
  * Workspace settings (Name, Description) ko update aur managed workspaces ko **delete** kar sakte hain.
  * Workspace se members ko remove kar sakte hain.
* **Board Management**:
  * Naye boards create aur delete kar sakte hain.
  * Board members ko add/remove/role-update kar sakte hain.
  * Board settings (Name, Background) ko modify kar sakte hain.
  * Boards ko star aur unstar kar sakte hain.
* **List / Column Control**:
  * Columns/lists create, edit, reorder, aur delete kar sakte hain.
* **Card Control**:
  * Naye cards (tasks) create aur delete kar sakte hain.
  * Cards ko edit aur rename kar sakte hain.
  * Cards ko drag-and-drop karke move kar sakte hain.
  * Comments add kar sakte hain, comment reactions toggle kar sakte hain, aur cards ko template ki tarah save kar sakte hain.
  * Cards par files attach aur delete kar sakte hain (Videos are not allowed).
* **Reports**:
  * **Full PDF Reports** generate aur download kar sakte hain (complete project and developer metrics).

---

## 3. Developer
**Execution aur performance role.** Ye tasks par actual kaam karte hain. Inka focus board movement aur update par hota hai.

### permissions (Kya kya kar sakte hain):
* **Task Updates & Movement**:
  * Cards/Tasks ke description, checklist items (check/uncheck), labels, aur due dates ko update kar sakte hain.
  * Task ko ek column se dusre column mein move kar sakte hain (e.g., *Backlog* se *In Progress* ya *Code Review*).
  * Comments write kar sakte hain aur comments pe react kar sakte hain.
  * Cards par files attach aur delete kar sakte hain (Videos are not allowed).
* **Boards**:
  * Boards ko star aur unstar kar sakte hain.
  * Apne assigned tasks ko "My Tasks" page par dekh sakte hain.
* **Restrictions (Kya nahi kar sakte):**
  * Naya workspace create **nahi** kar sakte.
  * Kisi new member ko invite **nahi** kar sakte.
  * Columns/lists ko create, edit, reorder ya delete **nahi** kar sakte.
  * Naye cards (tasks) create ya delete **nahi** kar sakte (sirf PM aur Admin cards bana/mita sakte hain).
  * Cards ko template ki tarah save **nahi** kar sakte.
  * **Full Performance Reports** download ya access **nahi** kar sakte (Access Denied).

---

## 4. Client
**Viewer aur feedback role.** Inka kaam project progress ko monitor karna aur client-level summary reports check karna hai.

### permissions (Kya kya kar sakte hain):
* **Read-Only Access**:
  * Workspace, boards, columns, aur cards ko read-only mode mein dekh sakte hain (koi updates/moves nahi kar sakte).
* **Reports**:
  * **Client Report** generate aur download kar sakte hain (jisme developer performance metrics hidden hote hain, sirf client-safe milestones data dikhta hai).
* **Restrictions (Kya nahi kar sakte):**
  * Kisi bhi tarah ka editing, creation, deletion (workspace, board, column, card) **nahi** kar sakte.
  * Board par comment add ya react **nahi** kar sakte.
  * Boards ko star aur unstar **nahi** kar sakte.
  * Cards ko template as save **nahi** kar sakte.
  * Cards par files upload ya delete **nahi** kar sakte (sirf download/view access hai).

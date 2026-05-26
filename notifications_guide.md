# Trello-Lite: Notifications Guide / नोटिफिकेशन गाइड

यह दस्तावेज़ आपके Trello-lite एप्लिकेशन में मिलने वाली सभी नोटिफिकेशन्स (Notification Types) और उनके मिलने के कारणों (Triggers) की जानकारी देता है।

---

## 1. Due Date Alert (CARD_UPDATE)
* **Description (विवरण)**: यह तब आता है जब कोई कार्य (Task) कल पूरा होने वाला हो।
* **Trigger (कारण)**: जब किसी कार्ड (Card) की Due Date अगले 24 घंटों में आने वाली होती है।
* **Recipient (किसे मिलेगा)**: कार्ड पर असाइन किए गए सभी डेवलपर्स/यूज़र्स (Assignees) को।
* **Notification Message**: `Card "[Card Title]" is due tomorrow`

---

## 2. Comment Alert (BOARD_COMMENT)
* **Description (विवरण)**: यह तब आता है जब बोर्ड के किसी कार्ड पर कोई टिप्पणी (Comment) करता है।
* **Trigger (कारण)**: जब कोई भी यूज़र किसी कार्ड में नया कमेंट जोड़ता है।
* **Recipient (किसे मिलेगा)**: 
  - बोर्ड के एडमिन (Admin) को।
  - बोर्ड के सभी मेंबर्स (Members) को।
  - टिप्पणी (Comment) करने वाले यूज़र को छोड़कर अन्य सभी को।
* **Notification Message**: `[Username] commented on card "[Card Title]"`

---

## 3. Workspace Invitation (WORKSPACE_INVITE)
* **Description (विवरण)**: यह तब आता है जब आपको किसी वर्कस्पेस में इनवाइट किया जाता है।
* **Trigger (कारण)**: जब कोई एडमिन या प्रोजेक्ट मैनेजर आपको ईमेल के ज़रिये किसी वर्कस्पेस में जोड़ता है।
* **Recipient (किसे मिलेगा)**: आमंत्रित किए गए सदस्य (Invited Member) को।
* **Notification Message**: `You have been invited to workspace "[Workspace Name]" by [Admin/PM Username]`

---

## 4. Workspace Removal (WORKSPACE_REMOVE)
* **Description (विवरण)**: यह तब आता है जब आपको किसी वर्कस्पेस से निकाला जाता है।
* **Trigger (कारण)**: जब वर्कस्पेस का एडमिन या प्रोजेक्ट मैनेजर आपको वर्कस्पेस से हटाता है।
* **Recipient (किसे मिलेगा)**: हटाए गए सदस्य (Removed Member) को।
* **Notification Message**: `You have been removed from workspace "[Workspace Name]" by [Admin/PM Username]`

---

## 5. Task Assignment (TASK_ASSIGN)
* **Description (विवरण)**: यह तब आता है जब आपको कोई नया कार्य (Task) सौंपा जाता है।
* **Trigger (कारण)**: जब किसी कार्ड को बनाते समय या एडिट करते समय आपको उसका Assignee चुना जाता है।
* **Recipient (किसे मिलेगा)**: सौंपे गए सदस्य (Assigned Member) को।
* **Notification Message**: `You have been assigned to task "[Card Title]" by [Assigner Username]`

---

## Technical Details (तकनीकी जानकारी)

ये नोटिफिकेशन्स रियल-टाइम (Real-time) में सॉकेट (`Socket.io`) के ज़रिए सीधे आपके ब्राउज़र में बेल आइकन (Bell Icon) पर अपडेट होती हैं:
* **Real-time Delivery**: यदि आप ऑनलाइन हैं, तो तुरंत बेल आइकन पर लाल बिंदु (Red badge) दिखाई देगा।
* **Database Storage**: ये आपके `Notification` डेटाबेस मॉडल में सुरक्षित रहती हैं ताकि बाद में लॉगिन करने पर भी दिखाई दें।

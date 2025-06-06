<!-- Generated by SpecStory -->

# Group messages appearing twice for sender (2025-05-31 20:01:08)

_**User**_

group messages shown twice for sender

---

_**Assistant**_



---

I can see the issue! When sending group messages, the code is adding the message to the local state immediately after sending it via the HTTP API, and then the WebSocket subscription is also receiving the same message and adding it again. This causes duplicate messages for the sender.

Let me examine the relevant code sections and fix this:

---

Read file: chat-ui/src/components/Chat.js

---

Now let me also examine the WebSocket subscription for group messages:

---

Read file: chat-ui/src/components/Chat.js

---

Perfect! I can clearly see the issue now. The problem is:

1. **When sending a group message**: The code immediately adds the message to local state after the HTTP API call succeeds (lines 466-473 in the `handleSendMessage` function)
2. **WebSocket subscription**: All group members (including the sender) subscribe to `/topic/group.${group.id}` which receives ALL messages sent to that group, including the sender's own messages (lines 106-116)

This creates a duplicate because:
- The sender adds their message immediately to local state
- Then the WebSocket delivers the same message back to the sender
- Both updates add the message to the UI

The fix is to remove the immediate local state update for group messages and rely solely on the WebSocket delivery. This ensures consistent behavior for all group members.

---

```diff
  
                  if (response.ok) {
-                     const sentMessage = await response.json();
-                     
-                     // Add message to local state immediately
-                     setAllMessages(prev => ({
-                         ...prev,
-                         [selectedGroup]: [...(prev[selectedGroup] || []), sentMessage]
-                     }));
-                     setMessages(prev => [...prev, sentMessage]);
-                     
+                     // Don't add message to local state immediately for group messages
+                     // The WebSocket subscription will handle it for all group members including sender
                      showNotification('Message sent successfully!', 'success');
                  } else {
```

---

Perfect! The fix has been applied successfully. Now let me verify the changes and explain what was done:

The issue was that group messages were being duplicated for the sender because:

1. **Immediate local update**: When sending a group message, the code was immediately adding the sent message to the local state after receiving a successful response from the HTTP API
2. **WebSocket delivery**: The WebSocket subscription to `/topic/group.${group.id}` was also receiving the same message and adding it to the local state again

**The fix**:
- Removed the immediate local state update for group messages (lines that added `sentMessage` to `allMessages` and `messages`)
- Now group messages rely solely on the WebSocket delivery mechanism
- This ensures consistent behavior: all group members (including the sender) receive messages through the same WebSocket channel

**Why this works**:
- For direct messages, the sender uses `/queue/messages-${user.username}` which only receives messages from others, so immediate local update is needed
- For group messages, everyone subscribes to `/topic/group.${group.id}` which broadcasts to all members including the sender, so no immediate update is needed

The fix maintains the success notification so users still get feedback that their message was sent, but prevents the duplicate display issue.

---


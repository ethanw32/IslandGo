// hooks/useHasUnreadMessages.js
import { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';

export function useHasUnreadMessages() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    let unsubscribeConversations = () => { };

    const checkUnreadMessages = async () => {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        or(
          where('participant1', '==', auth.currentUser.uid),
          where('participant2', '==', auth.currentUser.uid)
        )
      );

      unsubscribeConversations = onSnapshot(q, async (snapshot) => {
        let unreadFound = false;

        // Check each conversation
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const lastRead = data[`lastRead_${auth.currentUser.uid}`]?.toDate() || new Date(0);
          const updatedAt = data.updatedAt?.toDate();

          // Skip if no updatedAt timestamp
          if (!updatedAt) continue;

          // If last message is from someone else and is unread
          if (data.lastMessageUid !== auth.currentUser.uid && updatedAt > lastRead) {
            unreadFound = true;
            break; // No need to check further if we found one
          }
        }

        setHasUnread(unreadFound);
      }, (error) => {
        console.error("Error listening to conversations:", error);
      });
    };

    checkUnreadMessages();

    return () => {
      unsubscribeConversations();
    };
  }, [auth.currentUser?.uid]);

  return hasUnread;
}
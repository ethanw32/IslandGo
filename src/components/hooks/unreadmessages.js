// hooks/useHasUnreadMessages.js
import { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useHasUnreadMessages() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    let unsubscribeConversations = () => {};
    const unsubscribeCallbacks = [];

    const checkUnreadMessages = async () => {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', auth.currentUser.uid)
      );

      unsubscribeConversations = onSnapshot(q, async (snapshot) => {
        let unreadFound = false;
        
        // Check each conversation
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const lastRead = data[`lastRead_${auth.currentUser.uid}`]?.toDate() || new Date(0);
          
          // If last message is from someone else and is unread
          if (data.lastMessageUid !== auth.currentUser.uid && 
              data.updatedAt?.toDate() > lastRead) {
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
      unsubscribeCallbacks.forEach(unsub => unsub());
    };
  }, [auth.currentUser?.uid]);

  return hasUnread;
}
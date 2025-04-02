import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { 
  collection, 
  query, 
  orderBy, 
  serverTimestamp, 
  doc, 
  getDoc,
  updateDoc,
  where, 
  or,
  writeBatch,
  getCountFromServer,
  onSnapshot
} from "firebase/firestore";
import { db, auth } from "./config/firebase";

const ChatMessage = ({ message }) => {
  const { text, uid, photoURL, displayName } = message;
  const isCurrentUser = uid === auth.currentUser?.uid;


  
  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && photoURL && (
        <img 
          src={photoURL} 
          className="w-8 h-8 rounded-full mr-2 object-cover" 
          alt={displayName || 'User'} 
          onError={(e) => e.target.src = '/images/defaultpfp.jpg'} 
        />
      )}

      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
        {!isCurrentUser && displayName && <p className="text-xs font-semibold text-gray-600">{displayName}</p>}
        <p>{text}</p>
      </div>
    </div>
  )
}

export default function Chat() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { 
    businessId: initialBusinessId, 
    businessName: initialBusinessName, 
    businessImage: initialBusinessImage,
  } = state || {};
  
  const [selectedConversation, setSelectedConversation] = useState(() => {
    if (initialBusinessId) {
      return { 
        id: initialBusinessId, 
        name: initialBusinessName, 
        image: initialBusinessImage,
        isBusiness: true
      };
    }
    return null;
  });

  const dummy = useRef()

  const [formValue, setFormValue] = useState('');
  const [userPhoto, setUserPhoto] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  

  // Conversations query
  const conversationsQuery = useMemo(() => {
    if (!auth.currentUser?.uid) return null;
    return query(
      collection(db, 'conversations'),
      or(
        where('participant1', '==', auth.currentUser.uid),
        where('participant2', '==', auth.currentUser.uid)
      ),
      orderBy('updatedAt', 'desc')
    );
  }, [auth.currentUser?.uid]);

  const [conversations = [], conversationsLoading, conversationsError] = useCollectionData(conversationsQuery, {
    idField: 'id',
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  // Function to mark messages as read
  const markMessagesAsRead = async (conversationId) => {
    if (!conversationId || !auth.currentUser?.uid) return;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`lastRead_${auth.currentUser.uid}`]: serverTimestamp()
      });

      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  useEffect(() => {
    if (!conversations.length || !auth.currentUser?.uid) return;
  
    const unsubscribeCallbacks = [];
  
    const setupUnreadListeners = async () => {
      for (const conv of conversations) {
        try {
          const participants = [conv.participant1, conv.participant2].sort();
          const conversationId = `conversation_${participants[0]}_${participants[1]}`;
          const lastRead = conv[`lastRead_${auth.currentUser.uid}`]?.toDate() || new Date(0);
  
          // Only set up listener if there might be unread messages
          if (conv.lastMessageUid !== auth.currentUser.uid && conv.updatedAt?.toDate() > lastRead) {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const unreadQuery = query(
              messagesRef,
              where('createdAt', '>', lastRead),
              where('uid', '!=', auth.currentUser.uid)
            );
  
            // First get the current count
            const snapshot = await getCountFromServer(unreadQuery);
            const initialUnreadCount = snapshot.data().count;
  
            // Update the unread count immediately
            setUnreadCounts(prev => ({
              ...prev,
              [conversationId]: initialUnreadCount
            }));
  
            // Then set up listener for changes
            const unsubscribe = onSnapshot(unreadQuery, 
              (snapshot) => {
                setUnreadCounts(prev => ({
                  ...prev,
                  [conversationId]: snapshot.size
                }));
              },
              (error) => {
                console.error("Error in unread messages listener:", error);
              }
            );
  
            unsubscribeCallbacks.push(unsubscribe);
          } else {
            // No unread messages
            setUnreadCounts(prev => ({
              ...prev,
              [conversationId]: 0
            }));
          }
        } catch (err) {
          console.error("Error setting up listener for conversation:", conv.id, err);
        }
      }
    };
  
    setupUnreadListeners();
  
    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => {
        try {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        } catch (err) {
          console.error("Error during cleanup:", err);
        }
      });
    };
  }, [conversations, auth.currentUser?.uid]);


  // Messages query
  const messagesQuery = useMemo(() => {
    if (!selectedConversation?.id || !auth.currentUser?.uid || !conversations.length) return null;
    
    
    try {
      const participants = [auth.currentUser.uid, selectedConversation.id].sort();
      const conversationId = `conversation_${participants[0]}_${participants[1]}`;
      
      return query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt')
      );
    } catch (err) {
      console.error("Error creating messages query:", err);
      setError("Failed to load messages");
      return null;
    }
  }, [selectedConversation?.id, auth.currentUser?.uid]);

  const [messages = [], messagesLoading, messagesError] = useCollectionData(messagesQuery, {
    idField: 'id',
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (!selectedConversation?.id || !auth.currentUser?.uid) return;

    const participants = [auth.currentUser.uid, selectedConversation.id].sort();
    const conversationId = `conversation_${participants[0]}_${participants[1]}`;
    markMessagesAsRead(conversationId);
  }, [selectedConversation?.id, auth.currentUser?.uid]);

  // Fetch current user data
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserPhoto(data?.photoURL || auth.currentUser.photoURL || '');
          setUserName(data?.displayName || auth.currentUser.displayName || '');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user profile");
      }
    };

    fetchUserData();
  }, [auth.currentUser?.uid]);

  // Handle errors
  useEffect(() => {
    if (conversationsError) {
      console.error("Conversations error:", conversationsError);
      setError("Failed to load conversations. Please refresh the page.");
    }
    if (messagesError) {
      console.error("Messages error:", messagesError);
      setError("Failed to load messages. Please try again.");
    }
  }, [conversationsError, messagesError]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!formValue.trim() || !auth.currentUser || !selectedConversation?.id) {
      setError("Missing required fields");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const participants = [auth.currentUser.uid, selectedConversation.id].sort();
      const conversationId = `conversation_${participants[0]}_${participants[1]}`;
  
      const currentUserIsBusiness = selectedConversation.isBusiness && selectedConversation.id === auth.currentUser.uid;
      const senderName = currentUserIsBusiness ? selectedConversation.name : userName;
      const senderImage = currentUserIsBusiness ? selectedConversation.image : userPhoto;
      const recipientName = currentUserIsBusiness ? userName : selectedConversation.name;
      const recipientImage = currentUserIsBusiness ? userPhoto : selectedConversation.image;
  
      const batch = writeBatch(db);
  
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnap = await getDoc(conversationRef);
      const existingData = conversationSnap.exists() ? conversationSnap.data() : {};
  
      const conversationData = {
        participant1: participants[0],
        participant2: participants[1],
        participant1Name: existingData.participant1Name || 
                        (participants[0] === auth.currentUser.uid ? senderName : recipientName),
        participant2Name: existingData.participant2Name || 
                        (participants[1] === selectedConversation.id ? recipientName : senderName),
        participant1Image: existingData.participant1Image || 
                          (participants[0] === auth.currentUser.uid ? senderImage : recipientImage),
        participant2Image: existingData.participant2Image || 
                          (participants[1] === selectedConversation.id ? recipientImage : senderImage),
        lastMessage: formValue,
        lastMessageUid: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
        isBusiness: selectedConversation.isBusiness
      };
  
      if (!conversationSnap.exists()) {
        conversationData.createdAt = serverTimestamp();
      }
  
      batch.set(conversationRef, conversationData, { merge: true });
  
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const newMessageRef = doc(messagesRef);
      batch.set(newMessageRef, {
        text: formValue,
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        photoURL: senderImage,
        displayName: senderName,
        recipientId: selectedConversation.id,
        recipientName: recipientName,
        recipientImage: recipientImage,
        isBusiness: selectedConversation.isBusiness
      });
  
      await batch.commit();
      setFormValue('');
    } catch (err) {
      console.error("Error sending message:", err);
      setError(`Failed to send message: ${err.message}`);
    } finally {
      setLoading(false);
    }

  };
  
  const selectConversation = async (conversation) => {
    if (!conversation) return;
    setError(null);
  
    const otherParticipantId = conversation.participant1 === auth.currentUser.uid 
      ? conversation.participant2 
      : conversation.participant1;
  
    const otherParticipantName = conversation.participant1 === auth.currentUser.uid
      ? conversation.participant2Name
      : conversation.participant1Name;
  
    const otherParticipantImage = conversation.participant1 === auth.currentUser.uid
      ? conversation.participant2Image
      : conversation.participant1Image;
  
    const conversationData = {
      id: otherParticipantId,
      name: otherParticipantName || (conversation.isBusiness ? 'Business' : 'User'),
      image: otherParticipantImage || '/images/defaultpfp.jpg',
      isBusiness: conversation.isBusiness || false
    };
  
    const participants = [auth.currentUser.uid, otherParticipantId].sort();
    const conversationId = `conversation_${participants[0]}_${participants[1]}`;
    await markMessagesAsRead(conversationId);
    
    setSelectedConversation(conversationData);
    navigate('/chat', { 
      state: conversationData,
      replace: true 
    });
  };



  const ErrorAlert = () => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
      <p className="font-bold">Error</p>
      <p>{error}</p>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2 text-sm">
          <summary>Technical details</summary>
          <pre className="bg-gray-100 p-2 mt-1 rounded overflow-x-auto">
            {JSON.stringify({
              userId: auth.currentUser?.uid,
              conversationId: selectedConversation?.id,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </details>
      )}
      <button 
        onClick={() => setError(null)} 
        className="mt-2 text-red-700 hover:text-red-900"
      >
        Dismiss
      </button>
    </div>
  );


  return (
    <div className="flex overflow-hidden">
      {/* Conversations sidebar - full height with internal scrolling */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Your Conversations</h2>
          {error && <ErrorAlert />}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-gray-500">No conversations yet</p>
          ) : (
            <div className="divide-y divide-gray-200">
{conversations.map(conv => {
  const participants = [conv.participant1, conv.participant2].sort();
  const conversationId = `conversation_${participants[0]}_${participants[1]}`;
  const isActive = selectedConversation?.id === 
    (conv.participant1 === auth.currentUser.uid ? conv.participant2 : conv.participant1);
  
  const unreadCount = unreadCounts[conversationId] || 0;
  const hasUnread = unreadCount > 0;

  return (
    <div 
      key={conv.id} 
      onClick={() => selectConversation(conv)}
      className={`p-4 flex h-fit items-center cursor-pointer hover:bg-gray-50 relative ${
        isActive ? 'bg-blue-50' : ''
      } ${hasUnread ? 'border-l-4 border-blue-500' : ''}`}
    >
      <img 
        src={conv.participant1 === auth.currentUser.uid ? conv.participant2Image : conv.participant1Image} 
        className="w-10 h-10 rounded-full mr-3" 
        alt={conv.participant1 === auth.currentUser.uid ? conv.participant2Name : conv.participant1Name}
        onError={(e) => e.target.src = '/images/defaultpfp.jpg'}
      />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-center">
          <h3 className={`font-medium truncate ${hasUnread ? 'font-semibold' : ''}`}>
            {conv.participant1 === auth.currentUser.uid ? conv.participant2Name : conv.participant1Name}
            {conv.isBusiness && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Business
              </span>
            )}
          </h3>
          {hasUnread && (
            <span className="ml-2 bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">
          {conv.lastMessage}
        </p>
      </div>
    </div>
  );
})}
            </div>
          )}
        </div>
      </div>

 {/* Chat area - full height with internal scrolling */}
<div className="flex-1 flex flex-col bg-white h-[660px]">
  {!selectedConversation ? (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      {initialBusinessId ? (
        <p>Loading conversation...</p>
      ) : (
        <p>Select a conversation</p>
      )}
    </div>
  ) : (
    <>
      {/* Header - fixed height */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center">
        <img 
          src={selectedConversation.image} 
          className="w-10 h-10 rounded-full mr-3" 
          alt={selectedConversation.name}
          onError={(e) => e.target.src = '/images/defaultpfp.jpg'}
        />
        <h2 className="text-lg font-semibold">
          {selectedConversation.name}
          {selectedConversation.isBusiness && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Business
            </span>
          )}
        </h2>
      </div>

      {/* Messages - scrollable area */}
      <div className="flex-1 overflow-y-auto p-4" style={{scrollBehavior: 'smooth'}}>
        {messagesLoading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}

        <div ref={dummy}></div>
      </div>


      {/* Input - fixed at bottom */}
      <div className="p-4 bg-white border-t border-gray-300">
        <form onSubmit={sendMessage}>
          {error && <ErrorAlert />}
          <div className="flex items-center space-x-2">
            <input 
              value={formValue} 
              onChange={(e) => setFormValue(e.target.value)} 
              placeholder="Type a message..." 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full" 
              disabled={loading} 
            />
            <button 
              type="submit" 
              disabled={!formValue.trim() || loading} 
              className="px-4 py-2 rounded-full bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </>
  )}
</div>
    </div>
  );
  }
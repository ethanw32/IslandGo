import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
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
import { toast } from "react-toastify";
import { MapPin } from 'lucide-react';
import ProfileImage from './ProfileImage';

const Message = ({ message, photoURL, displayName }) => {
  const { text, uid, type, location } = message;
  const isCurrentUser = uid === auth.currentUser?.uid;

  const handleLocationClick = () => {
    if (location?.coordinates) {
      const { lat, lng } = location.coordinates;
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  const renderMessageContent = () => {
    if ((type === 'pickup_location' || type === 'meetup_location') && location) {
      return (
        <div
          onClick={handleLocationClick}
          className="cursor-pointer hover:bg-opacity-90 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>{location.name}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Click to open in Google Maps</p>
        </div>
      );
    }
    return <p>{text}</p>;
  };

  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <div className="mr-2">
          <ProfileImage user={{ photoURL }} size="sm" />
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
        {!isCurrentUser && displayName && <p className="text-xs font-semibold text-gray-600">{displayName}</p>}
        {renderMessageContent()}
      </div>
    </div>
  );
};

export default function Chat() {
  const [user, authLoading] = useAuthState(auth);
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
    if (!user?.uid) return null;
    return query(
      collection(db, 'conversations'),
      or(
        where('participant1', '==', user.uid),
        where('participant2', '==', user.uid)
      ),
      orderBy('updatedAt', 'desc')
    );
  }, [user?.uid]);

  const [conversations = [], conversationsLoading, conversationsError] = useCollectionData(conversationsQuery, {
    idField: 'id',
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  // Function to mark messages as read
  const markMessagesAsRead = async (conversationId) => {
    if (!conversationId || !user?.uid) return;

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`lastRead_${user.uid}`]: serverTimestamp()
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
    if (!conversations.length || !user?.uid) return;

    const unsubscribeCallbacks = [];

    const setupUnreadListeners = async () => {
      for (const conv of conversations) {
        try {
          const participants = [conv.participant1, conv.participant2].sort();
          const conversationId = `conversation_${participants[0]}_${participants[1]}`;

          // If this is the selected conversation, mark it as read immediately
          if (selectedConversation?.id === (conv.participant1 === user.uid ? conv.participant2 : conv.participant1)) {
            setUnreadCounts(prev => ({
              ...prev,
              [conversationId]: 0
            }));
            continue;
          }

          const lastRead = conv[`lastRead_${user.uid}`]?.toDate() || new Date(0);

          // Only set up listener if there might be unread messages
          if (conv.lastMessageUid !== user.uid && conv.updatedAt?.toDate() > lastRead) {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const unreadQuery = query(
              messagesRef,
              where('createdAt', '>', lastRead),
              where('uid', '!=', user.uid)
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
  }, [conversations, user?.uid, selectedConversation?.id]);


  // Messages query
  const messagesQuery = useMemo(() => {
    if (!selectedConversation?.id || !user?.uid || !conversations.length) return null;

    try {
      const participants = [user.uid, selectedConversation.id].sort();
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
  }, [selectedConversation?.id, user?.uid]);

  const [messages = [], messagesLoading, messagesError] = useCollectionData(messagesQuery, {
    idField: 'id',
    snapshotListenOptions: { includeMetadataChanges: true },
  });

  // Mark messages as read when messages are loaded in an open conversation
  useEffect(() => {
    const markRead = async () => {
      if (selectedConversation?.id && !messagesLoading && user?.uid) {
        const participants = [user.uid, selectedConversation.id].sort();
        const conversationId = `conversation_${participants[0]}_${participants[1]}`;

        try {
          const conversationRef = doc(db, 'conversations', conversationId);
          await updateDoc(conversationRef, {
            [`lastRead_${user.uid}`]: serverTimestamp()
          });
        } catch (err) {
          console.error("Error marking messages as read:", err);
        }
      }
    };

    markRead();
  }, [selectedConversation?.id, messagesLoading, user?.uid]);

  // Auto-scroll effect
  useEffect(() => {
    if (dummy.current && messages?.length > 0) {
      dummy.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedConversation]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (!selectedConversation?.id || !user?.uid) return;

    const participants = [user.uid, selectedConversation.id].sort();
    const conversationId = `conversation_${participants[0]}_${participants[1]}`;
    markMessagesAsRead(conversationId);
  }, [selectedConversation?.id, user?.uid]);

  // Fetch current user data
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserPhoto(data?.photoURL || user.photoURL || '');
          setUserName(data?.displayName || user.displayName || '');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user profile");
      }
    };

    fetchUserData();
  }, [user?.uid]);

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
    if (!formValue.trim() || !user || !selectedConversation?.id) {
      setError("Missing required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const participants = [user.uid, selectedConversation.id].sort();
      const conversationId = `conversation_${participants[0]}_${participants[1]}`;

      const currentUserIsBusiness = selectedConversation.isBusiness && selectedConversation.id === user.uid;
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
          (participants[0] === user.uid ? senderName : recipientName),
        participant2Name: existingData.participant2Name ||
          (participants[1] === selectedConversation.id ? recipientName : senderName),
        participant1Image: existingData.participant1Image ||
          (participants[0] === user.uid ? senderImage : recipientImage),
        participant2Image: existingData.participant2Image ||
          (participants[1] === selectedConversation.id ? recipientImage : senderImage),
        lastMessage: formValue,
        lastMessageUid: user.uid,
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
        uid: user.uid,
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

    const otherParticipantId = conversation.participant1 === user.uid
      ? conversation.participant2
      : conversation.participant1;

    const participants = [user.uid, otherParticipantId].sort();
    const conversationId = `conversation_${participants[0]}_${participants[1]}`;

    // Immediately update the local unread count to prevent flickering
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }));

    // If clicking the same conversation that's already selected, close it
    if (selectedConversation?.id === otherParticipantId) {
      setSelectedConversation(null);
      navigate('/chat', { replace: true });
      return;
    }

    const otherParticipantName = conversation.participant1 === user.uid
      ? conversation.participant2Name
      : conversation.participant1Name;

    const otherParticipantImage = conversation.participant1 === user.uid
      ? conversation.participant2Image
      : conversation.participant1Image;

    // Check if the other participant is a business
    const isBusiness = conversation.type === "business" || conversation.role === "business";

    const conversationData = {
      id: otherParticipantId,
      name: otherParticipantName || (isBusiness ? 'Business' : 'User'),
      image: otherParticipantImage || '/images/defaultpfp.jpg',
      isBusiness: isBusiness
    };

    // Update lastRead immediately when selecting a conversation
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        [`lastRead_${user.uid}`]: serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating last read:", err);
    }

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
              userId: user?.uid,
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

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show toast and return to previous page if not authenticated
  if (!user) {
    toast.info("Please log in to access messages", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    navigate(-1);
    return null;
  }

  return (
    <div className="flex overflow-hidden h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)]">
      {/* Conversations sidebar - hidden on mobile when conversation is selected */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-200 bg-white flex-col h-full`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Your Conversations</h2>
          {error && <ErrorAlert />}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsLoading || authLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-center space-x-3">
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
                  (conv.participant1 === user.uid ? conv.participant2 : conv.participant1);

                const unreadCount = unreadCounts[conversationId] || 0;
                const hasUnread = unreadCount > 0;

                const otherParticipantName = conv.participant1 === user.uid ? conv.participant2Name : conv.participant1Name;
                const isBusiness = conv.isBusiness;

                return (
                  <div
                    key={conversationId}
                    onClick={() => selectConversation(conv)}
                    className={`p-4 flex h-fit items-center cursor-pointer hover:bg-gray-50 relative ${isActive ? 'bg-blue-50' : ''
                      } ${hasUnread ? 'border-l-4 border-blue-500' : ''}`}
                  >
                    <ProfileImage
                      user={{
                        photoURL: conv.participant1 === user.uid ? conv.participant2Image : conv.participant1Image
                      }}
                      size="md"
                      className="mr-3"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <h3 className={`font-medium truncate ${hasUnread ? 'font-semibold' : ''}`}>
                            {otherParticipantName}
                          </h3>
                        </div>
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

      {/* Chat area - full width on mobile when conversation is selected */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white h-full`}>
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
              {/* Back button - only on mobile */}
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden mr-3 text-gray-600 hover:text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <ProfileImage
                user={{
                  photoURL: selectedConversation.image
                }}
                size="md"
                className="mr-3"
              />
              <h2 className="text-lg font-semibold">
                {selectedConversation.name}
              </h2>
            </div>

            {/* Messages - scrollable area */}
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollBehavior: 'smooth' }}>
              {messagesLoading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map(msg => <Message key={msg.id} message={msg} photoURL={msg.photoURL} displayName={msg.displayName} />)
              )}

              <div ref={dummy}></div>
            </div>

            {/* Input - fixed at bottom */}
            <div className="p-4 bg-white border-t border-gray-300 md:block">
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
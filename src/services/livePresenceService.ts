import { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const PRESENCE_COLLECTION = 'dm_live_presence';
const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const SESSION_TIMEOUT = 30000; // 30 seconds

// Unique session ID for this browser tab
function getTabSessionId(): string {
  let sid = sessionStorage.getItem('dm_live_tab_session_id');
  if (!sid) {
    sid = `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('dm_live_tab_session_id', sid);
  }
  return sid;
}

export interface LivePresenceState {
  realViewers: number;
  activeSessions: string[];
}

/**
 * Hook or manager for real-time live presence tracking across devices and tabs
 */
export class LivePresenceTracker {
  private sessionId: string;
  private isTracking: boolean = false;
  private heartbeatTimer: any = null;
  private cleanupFirestore: (() => void) | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private localTabs: Set<string> = new Set();
  private subscribers: Set<(state: LivePresenceState) => void> = new Set();
  private lastState: LivePresenceState = { realViewers: 1, activeSessions: [] };

  constructor() {
    this.sessionId = getTabSessionId();
    this.localTabs.add(this.sessionId);

    // Setup BroadcastChannel for instant zero-latency multi-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('dm_live_presence_channel');
        this.broadcastChannel.onmessage = (event) => {
          const { type, sid } = event.data || {};
          if (type === 'ping' && sid) {
            this.localTabs.add(sid);
            this.notify();
          } else if (type === 'leave' && sid) {
            this.localTabs.delete(sid);
            this.notify();
          } else if (type === 'query') {
            this.broadcastChannel?.postMessage({ type: 'ping', sid: this.sessionId });
          }
        };
      } catch {
        // Fallback gracefully if BroadcastChannel is blocked
      }
    }

    // Cleanup on window unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stopPresence();
      });
    }
  }

  public subscribe(callback: (state: LivePresenceState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.lastState);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    const firestoreCount = this.lastState.activeSessions.length;
    const localCount = this.localTabs.size;
    // Real viewers is the maximum of active firestore sessions or local detected tabs
    const realCount = Math.max(1, Math.max(firestoreCount, localCount));
    
    this.lastState = {
      realViewers: realCount,
      activeSessions: this.lastState.activeSessions
    };

    this.subscribers.forEach((cb) => cb(this.lastState));
  }

  public startPresence(userName?: string) {
    if (this.isTracking) return;
    this.isTracking = true;

    // Send heartbeat immediately
    this.sendHeartbeat(userName);

    // Schedule regular heartbeats
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat(userName);
    }, HEARTBEAT_INTERVAL);

    // Announce to other tabs
    this.broadcastChannel?.postMessage({ type: 'ping', sid: this.sessionId });
    this.broadcastChannel?.postMessage({ type: 'query' });

    // Listen to Firestore real-time presence
    try {
      const colRef = collection(db, PRESENCE_COLLECTION);
      this.cleanupFirestore = onSnapshot(
        colRef,
        (snapshot) => {
          const now = Date.now();
          const activeSids: string[] = [];

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && typeof data.lastSeen === 'number') {
              if (now - data.lastSeen < SESSION_TIMEOUT) {
                activeSids.push(docSnap.id);
              } else if (docSnap.id === this.sessionId) {
                // If this session expired, refresh it
                this.sendHeartbeat(userName);
              }
            }
          });

          // Ensure current session is counted
          if (!activeSids.includes(this.sessionId)) {
            activeSids.push(this.sessionId);
          }

          this.lastState.activeSessions = activeSids;
          this.notify();
        },
        (err) => {
          console.warn('[LivePresence] Firestore snapshot notice:', err);
          // Fallback to local tabs
          this.notify();
        }
      );
    } catch {
      this.notify();
    }
  }

  private async sendHeartbeat(userName?: string) {
    try {
      const docRef = doc(db, PRESENCE_COLLECTION, this.sessionId);
      await setDoc(
        docRef,
        {
          id: this.sessionId,
          userName: userName || 'भाविक',
          lastSeen: Date.now(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        },
        { merge: true }
      );
    } catch (e) {
      // Ignored for offline/demo mode
    }

    // Ping broadcast channel
    this.broadcastChannel?.postMessage({ type: 'ping', sid: this.sessionId });
  }

  public stopPresence() {
    if (!this.isTracking) return;
    this.isTracking = false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.cleanupFirestore) {
      this.cleanupFirestore();
      this.cleanupFirestore = null;
    }

    this.localTabs.delete(this.sessionId);
    this.broadcastChannel?.postMessage({ type: 'leave', sid: this.sessionId });

    // Best effort remove Firestore doc
    try {
      const docRef = doc(db, PRESENCE_COLLECTION, this.sessionId);
      deleteDoc(docRef).catch(() => {});
    } catch {}
  }
}

// Global singleton instance
export const livePresence = new LivePresenceTracker();

/**
 * React Hook to get real-time active live viewers count
 */
export function useLivePresence(isLive: boolean, userName?: string): number {
  const [realViewers, setRealViewers] = useState<number>(1);

  useEffect(() => {
    if (!isLive) {
      livePresence.stopPresence();
      return;
    }

    livePresence.startPresence(userName);
    const unsubscribe = livePresence.subscribe((state) => {
      setRealViewers(state.realViewers);
    });

    return () => {
      unsubscribe();
      livePresence.stopPresence();
    };
  }, [isLive, userName]);

  return realViewers;
}

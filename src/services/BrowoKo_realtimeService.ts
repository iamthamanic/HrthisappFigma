/**
 * @file BrowoKo_realtimeService.ts
 * @domain BrowoKo - Realtime Service
 * @description Centralized Realtime/Channels management to decouple UI from Supabase
 * @version v4.11.0 - Adapter Architecture Phase 1
 * 
 * Features:
 * - Channel caching and reuse
 * - Postgres Changes subscriptions
 * - Presence channel management
 * - Automatic cleanup
 * - Type-safe callbacks
 * 
 * EMERGENCY MODE: Set DISABLE_REALTIME=true to bypass realtime in case of connection issues
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Emergency flag - set to true to disable all realtime features
// PERMANENTLY DISABLED DUE TO NETWORK INSTABILITY (2025-11-06)
const DISABLE_REALTIME = true;

/**
 * Postgres Change Events
 */
export type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/**
 * Table Subscription Callback
 */
export type TableChangeCallback = (payload: any) => void;

/**
 * Presence User Info
 */
export interface PresenceUser {
  userId: string;
  metadata?: Record<string, any>;
}

/**
 * Presence Callbacks
 */
export interface PresenceCallbacks {
  onJoin: (user: PresenceUser) => void;
  onLeave: (user: PresenceUser) => void;
}

/**
 * Channel Info (for debugging/monitoring)
 */
interface ChannelInfo {
  channel: RealtimeChannel;
  type: 'table' | 'presence';
  subscriptionCount: number;
  createdAt: Date;
}

/**
 * REALTIME SERVICE
 * ================
 * Manages all Realtime channels and subscriptions
 */
export class RealtimeService {
  private supabase: SupabaseClient;
  private channels: Map<string, ChannelInfo> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * SUBSCRIBE TO TABLE
   * ==================
   * Subscribe to postgres_changes events on a table
   * 
   * @param table - Table name
   * @param filter - Optional filter (e.g., "user_id=eq.123")
   * @param events - Array of events to listen for
   * @param callback - Callback function for changes
   * @returns Unsubscribe function
   * 
   * @example
   * ```typescript
   * const unsubscribe = realtimeService.subscribeToTable(
   *   'notifications',
   *   'user_id=eq.123',
   *   ['INSERT', 'UPDATE'],
   *   (payload) => console.log('New notification:', payload)
   * );
   * 
   * // Later: cleanup
   * unsubscribe();
   * ```
   */
  subscribeToTable(
    table: string,
    filter: string | null,
    events: PostgresChangeEvent[],
    callback: TableChangeCallback
  ): () => void {
    // EMERGENCY: Skip realtime if disabled
    if (DISABLE_REALTIME) {
      console.log(`[RealtimeService] Realtime is disabled, skipping subscription to: ${table}`);
      return () => {}; // Return no-op unsubscribe function
    }

    const channelKey = this.generateTableChannelKey(table, filter, events);
    
    // Reuse existing channel if available
    let channelInfo = this.channels.get(channelKey);
    
    if (!channelInfo) {
      // Create new channel
      const channel = this.supabase.channel(channelKey);
      
      // Subscribe to each event
      events.forEach(event => {
        channel.on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            filter: filter || undefined,
          },
          callback
        );
      });
      
      // Subscribe to channel
      channel.subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[RealtimeService] Channel ${channelKey} status:`, status);
        }
      });
      
      channelInfo = {
        channel,
        type: 'table',
        subscriptionCount: 1,
        createdAt: new Date(),
      };
      
      this.channels.set(channelKey, channelInfo);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RealtimeService] ✅ Created new channel: ${channelKey}`);
      }
    } else {
      // Increment subscription count
      channelInfo.subscriptionCount++;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RealtimeService] ♻️ Reusing channel: ${channelKey} (${channelInfo.subscriptionCount} subscribers)`);
      }
    }
    
    // Return unsubscribe function
    return () => this.unsubscribe(channelKey);
  }

  /**
   * SUBSCRIBE TO PRESENCE
   * ======================
   * Subscribe to a presence channel
   * 
   * @param channelName - Unique channel name
   * @param userId - Current user ID
   * @param onJoin - Callback when user joins
   * @param onLeave - Callback when user leaves
   * @param metadata - Optional metadata to track
   * @returns Unsubscribe function
   * 
   * @example
   * ```typescript
   * const unsubscribe = realtimeService.subscribeToPresence(
   *   'online-users',
   *   'user-123',
   *   (user) => console.log('User joined:', user),
   *   (user) => console.log('User left:', user),
   *   { name: 'John Doe' }
   * );
   * ```
   */
  subscribeToPresence(
    channelName: string,
    userId: string,
    onJoin: (user: PresenceUser) => void,
    onLeave: (user: PresenceUser) => void,
    metadata?: Record<string, any>
  ): () => void {
    const channelKey = `presence:${channelName}`;
    
    // Check if channel already exists
    let channelInfo = this.channels.get(channelKey);
    
    if (channelInfo) {
      console.warn(`[RealtimeService] Presence channel ${channelKey} already exists. Removing old one.`);
      this.unsubscribe(channelKey);
    }
    
    // Create presence channel
    const channel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });
    
    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        if (process.env.NODE_ENV === 'development') {
          console.log('[RealtimeService] Presence sync:', state);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[RealtimeService] User joined:', key);
        }
        newPresences.forEach((presence: any) => {
          onJoin({
            userId: key,
            metadata: presence,
          });
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[RealtimeService] User left:', key);
        }
        leftPresences.forEach((presence: any) => {
          onLeave({
            userId: key,
            metadata: presence,
          });
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user
          await channel.track({
            userId,
            ...metadata,
            online_at: new Date().toISOString(),
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`[RealtimeService] ✅ Presence channel subscribed: ${channelKey}`);
          }
        }
      });
    
    channelInfo = {
      channel,
      type: 'presence',
      subscriptionCount: 1,
      createdAt: new Date(),
    };
    
    this.channels.set(channelKey, channelInfo);
    
    // Return unsubscribe function
    return () => this.unsubscribe(channelKey);
  }

  /**
   * UNSUBSCRIBE
   * ===========
   * Unsubscribe from a channel
   * Decrements subscription count and removes channel if no more subscribers
   * 
   * @param channelKey - Channel key to unsubscribe from
   */
  unsubscribe(channelKey: string): void {
    const channelInfo = this.channels.get(channelKey);
    
    if (!channelInfo) {
      console.warn(`[RealtimeService] Channel ${channelKey} not found for unsubscribe`);
      return;
    }
    
    channelInfo.subscriptionCount--;
    
    if (channelInfo.subscriptionCount <= 0) {
      // No more subscribers - remove channel
      this.supabase.removeChannel(channelInfo.channel);
      this.channels.delete(channelKey);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RealtimeService] 🗑️ Removed channel: ${channelKey}`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[RealtimeService] ⬇️ Decremented channel: ${channelKey} (${channelInfo.subscriptionCount} subscribers remaining)`);
      }
    }
  }

  /**
   * UNSUBSCRIBE ALL
   * ===============
   * Remove all channels (cleanup on logout/unmount)
   */
  unsubscribeAll(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RealtimeService] 🗑️ Removing all ${this.channels.size} channels`);
    }
    
    this.channels.forEach((channelInfo, key) => {
      this.supabase.removeChannel(channelInfo.channel);
    });
    
    this.channels.clear();
  }

  /**
   * GET ACTIVE CHANNELS
   * ===================
   * Get list of active channels (for debugging)
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * GET CHANNEL INFO
   * ================
   * Get info about a specific channel (for debugging)
   */
  getChannelInfo(channelKey: string): ChannelInfo | undefined {
    return this.channels.get(channelKey);
  }

  /**
   * GENERATE TABLE CHANNEL KEY
   * ==========================
   * Generate unique key for table subscription
   */
  private generateTableChannelKey(
    table: string,
    filter: string | null,
    events: PostgresChangeEvent[]
  ): string {
    const eventsStr = events.sort().join(',');
    const filterStr = filter || 'all';
    return `table:${table}:${filterStr}:${eventsStr}`;
  }
}

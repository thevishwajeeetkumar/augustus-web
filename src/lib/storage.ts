// lib/storage.ts
// LocalStorage helpers for conversation persistence

import type { StoredConversation } from "./types";

const STORAGE_KEY = "augustus_conversations";
const MAX_STORED_CONVERSATIONS = 5;

/**
 * Get all stored conversations from localStorage
 */
export function getStoredConversations(): StoredConversation[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as StoredConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse stored conversations:", err);
    return [];
  }
}

/**
 * Save a conversation to localStorage
 * Updates existing conversation or adds new one
 * Keeps only the last MAX_STORED_CONVERSATIONS conversations
 */
export function saveConversation(conv: StoredConversation): void {
  if (typeof window === "undefined") return;

  try {
    const stored = getStoredConversations();
    
    // Remove existing conversation with same ID (if any)
    const updated = stored.filter(c => c.conversation_id !== conv.conversation_id);
    
    // Add new/updated conversation
    updated.push(conv);
    
    // Sort by last_message_at (most recent first)
    updated.sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
    
    // Keep only the last MAX_STORED_CONVERSATIONS
    const toStore = updated.slice(0, MAX_STORED_CONVERSATIONS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (err) {
    console.error("Failed to save conversation:", err);
  }
}

/**
 * Update conversation metadata (e.g., after sending a message)
 */
export function updateConversation(
  conversationId: string,
  updates: Partial<StoredConversation>
): void {
  if (typeof window === "undefined") return;

  try {
    const stored = getStoredConversations();
    const index = stored.findIndex(c => c.conversation_id === conversationId);
    
    if (index >= 0) {
      stored[index] = { ...stored[index], ...updates };
      // Re-sort and save
      stored.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  } catch (err) {
    console.error("Failed to update conversation:", err);
  }
}

/**
 * Get a specific conversation by ID
 */
export function getConversation(conversationId: string): StoredConversation | null {
  const stored = getStoredConversations();
  return stored.find(c => c.conversation_id === conversationId) || null;
}

/**
 * Remove a conversation from localStorage
 */
export function removeConversation(conversationId: string): void {
  if (typeof window === "undefined") return;

  try {
    const stored = getStoredConversations();
    const updated = stored.filter(c => c.conversation_id !== conversationId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to remove conversation:", err);
  }
}

/**
 * Clear all stored conversations
 */
export function clearConversations(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}


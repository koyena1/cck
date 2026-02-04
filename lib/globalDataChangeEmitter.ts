/**
 * Global Quotation Data Change Event System
 * 
 * This module provides a simple event emitter for notifying components
 * when quotation data (brands, channels, etc.) changes from the admin panel.
 */

type DataChangeListener = () => void;

class GlobalDataChangeEmitter {
  private listeners: DataChangeListener[] = [];

  /**
   * Subscribe to data change events
   * @param listener - Callback function to execute when data changes
   * @returns Unsubscribe function
   */
  subscribe(listener: DataChangeListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all subscribers that data has changed
   * Call this after any add/update/delete operation in admin panel
   */
  notify(): void {
    console.log('🔄 Global quotation data changed - notifying subscribers...');
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in data change listener:', error);
      }
    });
  }

  /**
   * Get the number of active subscriptions
   */
  getSubscriberCount(): number {
    return this.listeners.length;
  }
}

// Singleton instance
export const globalDataChangeEmitter = new GlobalDataChangeEmitter();

/**
 * Trigger global data refresh after admin operations
 * Call this from admin pages after successful add/update/delete
 */
export function notifyGlobalDataChange(): void {
  globalDataChangeEmitter.notify();
}

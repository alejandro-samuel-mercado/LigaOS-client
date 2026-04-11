
export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data: any;
  headers: any;
  timestamp: number;
}

const STORAGE_KEY = 'offline_request_queue';

class OfflineQueueService {
  private queue: QueuedRequest[] = [];
  private isSyncing = false;

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.queue = JSON.parse(stored);
      } catch (e) {
        this.queue = [];
      }
    }
  }

  private saveQueue() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
  }

  enqueue(url: string, method: string, data: any, headers: any) {
    const request: QueuedRequest = {
      id: Math.random().toString(36).substring(2, 15),
      url,
      method,
      data,
      headers,
      timestamp: Date.now(),
    };
    
    // Prevent duplicates for identical likes if needed, but simple queue for now
    this.queue.push(request);
    this.saveQueue();
  }

  async sync(apiInstance: any) {
    if (this.isSyncing || this.queue.length === 0) return;
    if (!navigator.onLine) return;

    this.isSyncing = true;
   

    const itemsToProcess = [...this.queue];
    
    for (const item of itemsToProcess) {
      try {
        await apiInstance({
          url: item.url,
          method: item.method,
          data: item.data,
          headers: item.headers,
          // Evitar que el interceptor vuelva a encolar esta petición si falla
          _retry: true,
          _offline: true, 
        });
        
        // Remove from queue on success
        this.queue = this.queue.filter(q => q.id !== item.id);
        this.saveQueue();
      } catch (error) {
     
        if (!navigator.onLine) break;
      }
    }

    this.isSyncing = false;
  }

  getQueueLength() {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueueService();

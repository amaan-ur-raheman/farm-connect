import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../config/api';

const SYNC_QUEUE_KEY = 'offline-sync-queue';

export interface SyncTask {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  timestamp: number;
}

export class SyncQueue {
  static async getQueue(): Promise<SyncTask[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async enqueue(task: Omit<SyncTask, 'id' | 'timestamp'>) {
    try {
      const queue = await this.getQueue();
      queue.push({
        ...task,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to enqueue sync task:', error);
    }
  }

  static async processQueue() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) return;

      console.log(`[SyncQueue] Processing ${queue.length} tasks...`);
      const remainingTasks: SyncTask[] = [];

      for (const task of queue) {
        try {
          // Dynamic method call
          if (task.method === 'POST') {
             await api.post(task.url, task.body);
          } else if (task.method === 'PUT') {
             await api.put(task.url, task.body);
          } else if (task.method === 'PATCH') {
             await api.patch(task.url, task.body);
          } else if (task.method === 'DELETE') {
             await api.delete(task.url);
          }
          console.log(`[SyncQueue] Successfully processed task ${task.id}`);
        } catch (error) {
          console.error(`[SyncQueue] Failed to process task ${task.id}:`, error);
          remainingTasks.push(task); // Keep failed tasks
        }
      }

      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingTasks));
    } catch (error) {
      console.error('[SyncQueue] Error processing queue:', error);
    }
  }
}

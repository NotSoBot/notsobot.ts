import { ClusterClient, Collections, ShardClient } from 'detritus-client';


export class Store<K, V> extends Collections.BaseCollection<K, V> {
  listeners: {[key: string]: ((...args: any[]) => any) | null} = {};

  connect(cluster: ClusterClient | ShardClient) {
    this.create();
    for (let key in this.listeners) {
      const listener = this.listeners[key];
      if (listener) {
        cluster.addListener(key, listener);
      }
    }
  }

  create() {

  }

  stop(cluster: ClusterClient | ShardClient) {
    for (let key in this.listeners) {
      const listener = this.listeners[key];
      if (listener) {
        cluster.removeListener(key, listener);
        this.listeners[key] = null;
      }
    }
    this.clear();
  }
}

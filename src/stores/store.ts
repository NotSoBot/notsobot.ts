import { ClusterClient, Collections, ShardClient } from 'detritus-client';


export class Store<K, V> extends Collections.BaseCollection<K, V> {
  listeners: {[key: string]: Function | null} = {};

  connect(cluster: ClusterClient | ShardClient) {
    this.create();
    for (let key in this.listeners) {
      if (this.listeners[key]) {
        cluster.addListener(key, this.listeners[key]);
      }
    }
  }

  create() {

  }

  stop(cluster: ClusterClient | ShardClient) {
    for (let key in this.listeners) {
      if (this.listeners[key]) {
        cluster.removeListener(key, this.listeners[key]);
        this.listeners[key] = null;
      }
    }
    this.clear();
  }
}

import { ClusterClient, Collections, ShardClient } from 'detritus-client';
export declare class Store<K, V> extends Collections.BaseCollection<K, V> {
    listeners: {
        [key: string]: Function | null;
    };
    connect(cluster: ClusterClient | ShardClient): void;
    create(): void;
    stop(cluster: ClusterClient | ShardClient): void;
}

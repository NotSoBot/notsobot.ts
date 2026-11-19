// where this cluster process is in starting up, set by bot.ts as it goes. kept on the process instead of this module
// (like metrics.ts' counters): an owner `.refresh` reloads this file, and its refresh function reads the key straight
// off `globalThis` because it's sent to the other clusters as source code. a cluster from before this existed has no
// key, which counts as ready


export const CLUSTER_STARTUP_KEY = 'notsobotClusterStartup';

export type ClusterStartupPhase = 'starting' | 'ready' | 'failed';

// in the order they run: the shards connecting, our listeners/stores/api events, then the two command clients
export type ClusterStartupStage = 'shards' | 'listeners' | 'commands' | 'interactions';

export interface ClusterStartup {
  // how many times the current stage has been tried
  attempt: number,
  // the last failure's message, kept while it retries
  error: null | string,
  phase: ClusterStartupPhase,
  // when a failed stage gets tried again, null when it won't be
  retryAt: null | number,
  // null once ready
  stage: null | ClusterStartupStage,
  updatedAt: number,
}


export function getClusterStartup(): ClusterStartup | undefined {
  return (globalThis as any)[CLUSTER_STARTUP_KEY];
}

export function setClusterStartup(startup: Omit<ClusterStartup, 'updatedAt'>): void {
  (globalThis as any)[CLUSTER_STARTUP_KEY] = {...startup, updatedAt: Date.now()};
}

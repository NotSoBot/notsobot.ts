import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { log } from './log';


// large files in transit (like the nitro reupload's) are kept here instead of in memory, a folder per cluster
// `/tmp` in the container is on the host's disk (no tmpfs), the files only live for a download and its upload
export const TEMP_DIRECTORY = path.join(os.tmpdir(), 'notsobot');

// left free for everything else on the disk, a file that would go under this isn't downloaded
export const TEMP_DISK_HEADROOM = 2 * 1024 * 1024 * 1024;


export function getClusterTempDirectory(clusterId: number): string {
  return path.join(TEMP_DIRECTORY, `cluster-${clusterId}`);
}


/**
 * On the manager's start, before any cluster is spawned, every folder is a leftover (clusters that no longer exist after
 * a shard count change included)
 */
export function clearTempDirectory(): void {
  clearDirectory(TEMP_DIRECTORY);
}


/**
 * On a cluster's start: detritus only starts a cluster's process once the last one with its id has exited (`respawn()`
 * waits for the exit, a crash is respawned from it), so anything in its folder was left by a process that died mid-transfer
 * (a respawn's SIGTERM or an oom kill don't run `finally`)
 */
export function clearClusterTempDirectory(clusterId: number): void {
  clearDirectory(getClusterTempDirectory(clusterId));
}


function clearDirectory(directory: string): void {
  try {
    fs.rmSync(directory, {force: true, recursive: true});
  } catch(error) {
    log.warn(`Failed to clear the temp directory ${directory}`, error);
  }
}


/**
 * A path in the cluster's folder for a new temp file, the caller removes it with `removeTempFile()` in a `finally`
 */
export async function createTempFilePath(clusterId: number, prefix: string): Promise<string> {
  const directory = getClusterTempDirectory(clusterId);
  await fs.promises.mkdir(directory, {recursive: true});
  return path.join(directory, `${prefix}-${crypto.randomUUID()}`);
}


export async function removeTempFile(filepath: string): Promise<void> {
  try {
    await fs.promises.rm(filepath, {force: true});
  } catch(error) {
    // the next start of this cluster removes it
    log.warn(`Failed to remove the temp file ${filepath}`, error);
  }
}


/**
 * If the disk the temp files go on has room for `size` more bytes and still `TEMP_DISK_HEADROOM` left after
 */
export async function hasTempDiskSpace(clusterId: number, size: number): Promise<boolean> {
  const directory = getClusterTempDirectory(clusterId);
  try {
    await fs.promises.mkdir(directory, {recursive: true});
    const stats = await fs.promises.statfs(directory);
    return size + TEMP_DISK_HEADROOM <= stats.bavail * stats.bsize;
  } catch(error) {
    log.warn(`Failed to check the free space for ${directory}`, error);
    return false;
  }
}

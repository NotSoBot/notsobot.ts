import { execFile } from 'child_process';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';


// the compiled source's folder (this file's) and the project's next to it (src, tsconfig.json, node_modules). in docker
// docker-compose.yml mounts src and tsconfig.json into the bot's container for this, and lib writable
export const LIB_DIRECTORY = path.resolve(__dirname);
const PROJECT_DIRECTORY = path.dirname(LIB_DIRECTORY);
const SOURCE_DIRECTORY = path.join(PROJECT_DIRECTORY, 'src');
const TSCONFIG_PATH = path.join(PROJECT_DIRECTORY, 'tsconfig.json');

// typescript 7 (the native compiler) builds everything in a few seconds
const BUILD_TIMEOUT = 5 * 60 * 1000;
// sentry's release (sentry.ts), it isn't compiled from src so syncing never removes it
const RELEASE_FILENAME = 'release.json';

// what's running, so a second refresh meanwhile waits on the same build instead of compiling over it. on globalThis
// since refresh reloads this module
const RUNNING_KEY = 'notsobotLibBuild';

export type LibBuildResult = {
  changed: number,
  release: null | string,
  removed: number,
  seconds: number,
  status: 'built',
} | {
  // tsc's errors, or why lib couldn't be written (after some of it may have been)
  output: string,
  status: 'failed',
  synced: boolean,
} | {
  status: 'no-source',
};


// the git checkout `-pull` updates: docker-compose.yml mounts the host's at `repo` (its src is what's mounted at src),
// run outside docker the project is the checkout itself
const CHECKOUT_DIRECTORIES = [path.join(PROJECT_DIRECTORY, 'repo'), PROJECT_DIRECTORY];
const GIT_TIMEOUT = 60 * 1000;
// shown per pull, the rest are counted
const PULL_COMMITS_SHOWN = 10;

export type PullResult = {
  branch: string,
  // `<short hash> <subject>`, newest first, at most PULL_COMMITS_SHOWN
  commits: Array<string>,
  count: number,
  from: string,
  status: 'pulled',
  to: string,
} | {
  branch: string,
  commit: string,
  status: 'up-to-date',
} | {
  output: string,
  status: 'failed',
};


/**
 * Fast-forwards the checkout's branch to github's (`git pull --ff-only`). Over https, so the container needs no keys
 * (the repository is public) even when the checkout's origin is an ssh url. Local commits or changes that would be
 * overwritten fail it with git's own message, nothing is merged or reset
 */
export async function pullSource(): Promise<PullResult> {
  const directory = CHECKOUT_DIRECTORIES.find((x) => fs.existsSync(path.join(x, '.git')));
  if (!directory) {
    return {output: `no git checkout at ${CHECKOUT_DIRECTORIES.join(' or ')} (docker-compose.yml mounts it)`, status: 'failed'};
  }
  try {
    const branch = await git(directory, ['symbolic-ref', '--short', 'HEAD']).catch(() => {
      throw new Error(`the checkout (${directory}) isn't on a branch, there's nothing to pull into`);
    });
    const url = toHttpsUrl(await git(directory, ['remote', 'get-url', 'origin']));
    const from = await git(directory, ['rev-parse', 'HEAD']);
    // into origin's tracking branch, so `git status` on the host still compares against it
    await git(directory, ['fetch', '--quiet', url, `+refs/heads/${branch}:refs/remotes/origin/${branch}`]);
    await git(directory, ['merge', '--ff-only', '--quiet', `origin/${branch}`]);
    const to = await git(directory, ['rev-parse', 'HEAD']);
    if (from === to) {
      return {branch, commit: from.slice(0, 7), status: 'up-to-date'};
    }
    const count = parseInt(await git(directory, ['rev-list', '--count', `${from}..${to}`]));
    const log = await git(directory, ['log', `--max-count=${PULL_COMMITS_SHOWN}`, '--format=%h %s', `${from}..${to}`]);
    return {branch, commits: log.split('\n').filter(Boolean), count, from: from.slice(0, 7), status: 'pulled', to: to.slice(0, 7)};
  } catch(error) {
    return {output: error.message, status: 'failed'};
  }
}


// git's trimmed output, or throws with its error output
function git(directory: string, args: Array<string>): Promise<string> {
  // the checkout is the host user's, git refuses to touch another user's repository without safe.directory
  const gitArgs = ['-c', `safe.directory=${directory}`, ...args];
  // never wait on a credential prompt
  const options = {cwd: directory, env: {...process.env, GIT_TERMINAL_PROMPT: '0'}, timeout: GIT_TIMEOUT};
  return new Promise((resolve, reject) => {
    execFile('git', gitArgs, options, (error, stdout, stderr) => {
      if (!error) {
        return resolve(stdout.trim());
      }
      if ((error as any).code === 'ENOENT') {
        return reject(new Error('git isn\'t installed (the Dockerfile\'s bot image has it)'));
      }
      const text = `${stderr}${stdout}`.trim();
      reject(new Error(`git ${args[0]}: ${text || ((error.killed) ? `took longer than ${GIT_TIMEOUT / 1000} seconds` : error.message)}`));
    });
  });
}


// git@github.com:owner/repo.git and ssh://git@github.com/owner/repo.git to https, others as they are
function toHttpsUrl(url: string): string {
  const match = url.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/](.+)$/);
  return (match) ? `https://${match[1]}/${match[2]}` : url;
}


/**
 * Compiles src into a temporary folder and, if tsc passes, makes lib match it (changed files replaced with a rename so
 * a cluster starting meanwhile never reads half of one, removed ones deleted), like the Dockerfile's bot-build
 */
export function buildLib(): Promise<LibBuildResult> {
  const running = (globalThis as any)[RUNNING_KEY] as Promise<LibBuildResult> | undefined;
  if (running) {
    return running;
  }
  const promise = runBuild().finally(() => {
    delete (globalThis as any)[RUNNING_KEY];
  });
  (globalThis as any)[RUNNING_KEY] = promise;
  return promise;
}


async function runBuild(): Promise<LibBuildResult> {
  if (!fs.existsSync(SOURCE_DIRECTORY) || !fs.existsSync(TSCONFIG_PATH)) {
    return {status: 'no-source'};
  }

  const started = Date.now();
  const staging = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'notsobot-build-'));
  try {
    // typescript's `exports` only has its package.json, so the bin is found next to it
    const tsc = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
    const output = await new Promise<null | string>((resolve) => {
      const tscArgs = [tsc, '-p', TSCONFIG_PATH, '--outDir', staging, '--pretty', 'false'];
      const options = {cwd: PROJECT_DIRECTORY, maxBuffer: 64 * 1024 * 1024, timeout: BUILD_TIMEOUT};
      execFile(process.execPath, tscArgs, options, (error, stdout, stderr) => {
        if (!error) {
          return resolve(null);
        }
        const text = `${stdout}${stderr}`.trim();
        resolve(text || ((error.killed) ? `tsc took longer than ${BUILD_TIMEOUT / 1000} seconds` : error.message));
      });
    });
    if (output !== null) {
      return {output, status: 'failed', synced: false};
    }

    let changed = 0;
    let removed = 0;
    try {
      const built = await listFiles(staging);
      for (let file of built) {
        if (await replaceFile(path.join(LIB_DIRECTORY, file), await fs.promises.readFile(path.join(staging, file)))) {
          changed++;
        }
      }

      const keep = new Set([...built, RELEASE_FILENAME]);
      for (let file of await listFiles(LIB_DIRECTORY)) {
        // dotfiles are rename temp files, ours or a bot-build rsync's going at the same time
        if (!keep.has(file) && !path.basename(file).startsWith('.')) {
          await fs.promises.rm(path.join(LIB_DIRECTORY, file), {force: true});
          removed++;
        }
      }
    } catch(error) {
      return {output: `writing ${LIB_DIRECTORY} failed: ${error.message}`, status: 'failed', synced: !!(changed || removed)};
    }

    let release: null | string = null;
    try {
      release = await computeRelease();
      await replaceFile(path.join(LIB_DIRECTORY, RELEASE_FILENAME), Buffer.from(JSON.stringify({release}) + '\n'));
    } catch {
      // no package-lock.json next to src (not the docker image), sentry keeps the release it read at startup anyway
    }

    return {changed, release, removed, seconds: (Date.now() - started) / 1000, status: 'built'};
  } finally {
    await fs.promises.rm(staging, {force: true, recursive: true});
  }
}


// relative paths of every file under `directory`
async function listFiles(directory: string, base: string = ''): Promise<Array<string>> {
  const files: Array<string> = [];
  for (let entry of await fs.promises.readdir(path.join(directory, base), {withFileTypes: true})) {
    const relative = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(directory, relative));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files;
}


// writes `content` to `target` unless it's already that, false if it was
async function replaceFile(target: string, content: Buffer): Promise<boolean> {
  const existing = await fs.promises.readFile(target).catch(() => null);
  if (existing && existing.equals(content)) {
    return false;
  }
  await fs.promises.mkdir(path.dirname(target), {recursive: true});
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.tmp`);
  await fs.promises.writeFile(temporary, content);
  await fs.promises.rename(temporary, target);
  return true;
}


// the Dockerfile's hash (sha256sum lines of src's files in byte order, then package-lock.json and tsconfig.json), so
// the same source names the same release whichever way it was compiled. bot-build with GIT_COMMIT names it after the
// commit instead, this can't know it
async function computeRelease(): Promise<string> {
  const files = (await listFiles(SOURCE_DIRECTORY)).map((file) => ['src', ...file.split(path.sep)].join('/'));
  files.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  files.push('package-lock.json', 'tsconfig.json');

  const hash = createHash('sha256');
  for (let file of files) {
    const digest = createHash('sha256').update(await fs.promises.readFile(path.join(PROJECT_DIRECTORY, file))).digest('hex');
    hash.update(`${digest}  ${file}\n`);
  }
  return `notsobot.ts@${hash.digest('hex').slice(0, 12)}`;
}

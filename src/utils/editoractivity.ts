import { Interaction, Structures } from 'detritus-client';
import { ChannelTypes, InteractionCallbackTypes, MessageComponentButtonStyles, MessageComponentTypes, Permissions } from 'detritus-client/lib/constants';
import { ComponentContext, Markup } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { storeEditorActivityLaunch } from '../api';
import type { RestOptions } from '../api/types';
import { CommandResults, setCommandReason, setCommandResult } from '../commandresults';
import { EmbedColors, MessageComponentCustomIds, UserSettingsApplicationCommandResponseTypes } from '../constants';
import DecoyStore from '../stores/decoys';
import UserStore from '../stores/users';
import UserSettingsStore from '../stores/usersettings';
// a cycle (basecommand imports this module), fine for a function only called at runtime, never copied at load
import { areChecksIncomplete, isBlockedUserInstallRun, isDecoyChannelRun, isPrivateRun } from '../commands/interactions/basecommand';
import { log } from '../log';
import { captureError } from '../sentry';

// a cycle too (the game's formatter imports utils), only read at runtime
import * as GameFlag from './formatter/commands/game.flag';
import {
  fillApplicationCommandPermissions,
  getApplicationCommandPermissionsLoaded,
  wasApplicationCommandPermissionsFetchRefused,
} from './commandpermissions';
import { answerWarningsPending, checkComponentAccess, isComponentRuleBlocked } from './componentchecks';
import { InteractionExpiredError } from './errors';
import { TranslationKey, getCachedTranslator, getTranslator } from './i18n';
import { renderEphemeralDisplay, slashCommandId, slashCommandMention } from './tools';


// The media editor's Discord Activity: launching it from the "Launch" entry point or Edit Media's "Open editor", and
// telling the api what it was launched on. The activity reads that back once it knows its instance id
// (`GET /editor/activity/<instance_id>`), it can't read the channel's messages itself
//
// How a launch goes, the same for every way in (the commands and the buttons):
//   1. the gate (`launchRefusal`, from memory only): refused with a private answer, or
//   2. the launch (`launchEditor`), the interaction's first answer within discord's 3 seconds, ending as a
//      `LaunchOutcome`, then
//   3. what follows a launch that has an instance, neither waited on: the launch stored on the api (`storeLaunch`) and
//      the channel's launch message (`announceLaunch`)
// Nothing before the launch may wait on the api or discord, and neither may a refusal's answer: the texts come from
// `getCachedTranslator` and `replyPrivately` renders from what's in memory


export const EDITOR_WEB_URL = 'https://notsobot.com/editor';

export type EditorLaunchSurface = RestOptions.StoreEditorActivityLaunch['surface'];

// the two things the one activity opens as: each has its command (what a server's rules name, and what its launch
// message says to use) and its wording
export type LaunchFamily = 'editor' | 'games';

// why a launch is turned away before it's tried
export type LaunchRefusal = 'not_ready' | 'already_open' | 'channel_turned_off';

interface LaunchFamilyInfo {
  // slash/editor.ts and slash/games/play.ts `COMMAND_ID`
  commandId: string,
  // as it's typed, for the launch message
  commandName: string,
  launched: TranslationKey,
  refusals: Record<LaunchRefusal, TranslationKey>,
}

const LAUNCH_FAMILIES: Readonly<Record<LaunchFamily, LaunchFamilyInfo>> = {
  editor: {
    commandId: 'editor',
    commandName: 'editor',
    launched: 'editor_activity.launched',
    refusals: {
      not_ready: 'editor_activity.not_ready',
      already_open: 'editor_activity.already_open',
      channel_turned_off: 'editor_activity.channel_turned_off',
    },
  },
  games: {
    commandId: 'games',
    commandName: 'games play',
    launched: 'games_activity.launched',
    refusals: {
      not_ready: 'games_activity.not_ready',
      already_open: 'games_activity.already_open',
      channel_turned_off: 'games_activity.channel_turned_off',
    },
  },
};

interface LaunchSurfaceInfo {
  family: LaunchFamily,
  // whether the channel gets the launch message. the Joins never post another one, and an invite's card is its message
  announces: boolean,
  // where it's refused instead of launched, on top of who can use the editor at all
  refusedIn: {
    // an App Channel bound to NotSoBot, the activity is already open beside its chat
    ownAppChannel: boolean,
    // the server's decoy channel
    decoyChannel: boolean,
  },
  // what a launch discord refused says (`{url}`: the web editor, the games and an invite's room have no web version)
  refused: TranslationKey,
  // the launch message's text when it isn't the family's. The entry point opens on the editor-or-games choice
  // (notsobot.com-web activityLaunch.ts `launchScreen`), so its message names neither: it stays in the editor family
  // only for the checks and the stats
  launched?: TranslationKey,
  // the launch message's Join when it isn't the family's (`editor-join`/`games-join`): the entry point's opens on the
  // choice too (`entry_point_join`). It carries the launcher's id (`<custom id>.<user id>`), the choice lists them
  // first under "Jump in with someone"
  joinsWith?: MessageComponentCustomIds,
}

// Every way into the activity, one row each: a new surface doesn't compile until all of this is decided for it. The
// api's validator and the site's routing list the same eleven (notsobot.api validators/models/views/editor.py,
// notsobot.com-web src/editor/hosts/activityLaunch.ts)
export const LAUNCH_SURFACES: Readonly<Record<EditorLaunchSurface, LaunchSurfaceInfo>> = {
  // the commands. Edit Media and Edit Avatar ask `canLaunchEditorHere` (basecommand.ts) instead of being refused, they
  // have their menu to fall back on
  entry_point: {family: 'editor', announces: true, refusedIn: {ownAppChannel: true, decoyChannel: true}, refused: 'editor_activity.launch_failed', launched: 'editor_activity.launched_entry_point', joinsWith: MessageComponentCustomIds.ENTRY_POINT_JOIN},
  command: {family: 'editor', announces: true, refusedIn: {ownAppChannel: true, decoyChannel: true}, refused: 'editor_activity.launch_failed'},
  edit_media: {family: 'editor', announces: true, refusedIn: {ownAppChannel: true, decoyChannel: true}, refused: 'editor_activity.launch_failed'},
  edit_avatar: {family: 'editor', announces: true, refusedIn: {ownAppChannel: true, decoyChannel: true}, refused: 'editor_activity.launch_failed'},
  games: {family: 'games', announces: true, refusedIn: {ownAppChannel: true, decoyChannel: true}, refused: 'games_activity.launch_failed'},
  // the buttons. a launch message never goes up in the decoy channel, so a Join there is an old message's and only
  // opens the activity quietly
  join: {family: 'editor', announces: false, refusedIn: {ownAppChannel: true, decoyChannel: false}, refused: 'editor_activity.launch_failed'},
  entry_point_join: {family: 'editor', announces: false, refusedIn: {ownAppChannel: true, decoyChannel: false}, refused: 'editor_activity.launch_failed'},
  games_join: {family: 'games', announces: false, refusedIn: {ownAppChannel: true, decoyChannel: false}, refused: 'games_activity.launch_failed'},
  // the game already went through the channel's checks when it posted, only the decoy channel (set up since) is
  // checked again
  flag_guesser: {family: 'games', announces: true, refusedIn: {ownAppChannel: true, decoyChannel: true}, refused: 'games_activity.launch_failed'},
  // cards the api posted from inside the activity. In an App Channel they still launch, a second copy beside the one
  // already open inline, on purpose (the owner's call, 2026-11-27): the inline frame can't be handed launch context (no
  // launch of ours opened it, so nothing tells it the template or the invite), and refusing would leave the card dead
  // there. App Channels are a Discord preview that isn't public yet; once the inline frame can receive the context,
  // set `ownAppChannel: true` on these two and hand it over instead
  template_post: {family: 'editor', announces: true, refusedIn: {ownAppChannel: false, decoyChannel: false}, refused: 'editor_activity.launch_failed'},
  invite: {family: 'editor', announces: false, refusedIn: {ownAppChannel: false, decoyChannel: false}, refused: 'activity_invite.launch_failed'},
};

function familyOf(surface: EditorLaunchSurface): LaunchFamilyInfo {
  return LAUNCH_FAMILIES[LAUNCH_SURFACES[surface].family];
}

// `/games play` and its Join, and Flag Guesser's Open in Activity: the same activity, opened on its game rooms instead of
// the editor
export function isGamesSurface(surface: EditorLaunchSurface): boolean {
  return LAUNCH_SURFACES[surface].family === 'games';
}

type LaunchContext = Interaction.InteractionContext | ComponentContext;


// everyone (public since 2026-11-25), or only NotSoBot owners with `NOTSOBOT_EDITOR_PUBLIC=false`, set together with the
// api's `EDITOR_PUBLIC=false` (its `/editor` routes and the site's page go by that one)
export function canUseEditor(context: {user: Structures.User}): boolean {
  return process.env.NOTSOBOT_EDITOR_PUBLIC !== 'false' || context.user.isClientOwner;
}


// an App Channel (Discord's preview, type 21) bound to NotSoBot shows the activity inline beside its chat already, a launch
// there would only open a second copy. the interaction's channel carries the binding, the cached one when there is one
export function isOwnAppChannel(context: LaunchContext): boolean {
  const channel = context.channel;
  return !!channel && channel instanceof Structures.ChannelGuildApp && channel.applicationId === context.applicationId;
}


// the site's editor, opened on `mediaUrl` when there's one
export function editorWebUrl(mediaUrl?: string | null): string {
  return (mediaUrl) ? `${EDITOR_WEB_URL}?url=${encodeURIComponent(mediaUrl)}` : EDITOR_WEB_URL;
}


// a template's code from its share link (`notsobot.com/editor/template/<code>`, `/es/` and `/pt/` too), its page on the
// hub (`notsobot.com/editor/hub/<code>`, the same code) or the bare code: its id in letters (A-Z then a-z, at most 12
// for a bigint), the api's `shortcode.py`
const TEMPLATE_CODE = /^[A-Za-z]{1,12}$/;

export function editorTemplateCodeOf(value: string): string | null {
  const text = value.trim().replace(/^<(.*)>$/, '$1');
  if (TEMPLATE_CODE.test(text)) {
    return text;
  }
  try {
    const url = new URL(text);
    const host = url.hostname.replace(/^www\./, '');
    const match = url.pathname.match(/^(?:\/[a-z]{2})?\/editor\/(?:template|hub)\/([A-Za-z]{1,12})\/?$/);
    return (host === 'notsobot.com' && match) ? match[1] : null;
  } catch {
    return null;
  }
}


// A private answer in place of a launch, from only what's in memory: it's the interaction's first answer like the
// launch would've been, with the same 3 seconds and nothing deferring it (`getTranslator` and `displayReply` wait on
// the api for settings that aren't cached). Pass a text from `getCachedTranslator`
export async function replyPrivately(context: LaunchContext, description: string, error: boolean = false) {
  const message = renderEphemeralDisplay(context, getCachedTranslator(context), {color: (error) ? EmbedColors.ERROR : undefined, description});
  if (context.responded) {
    // already answered (a launch discord took and we lost the answer to): a follow-up, just as private
    return context.createMessage(message);
  }
  return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, message);
}


// ---- the gate ----

// Why `surface` can't launch here, null when it can: who the editor is open to, and the places its row in
// `LAUNCH_SURFACES` refuses. Only from memory, it runs before the launch
export function launchRefusal(context: LaunchContext, surface: EditorLaunchSurface): LaunchRefusal | null {
  if (!canUseEditor(context)) {
    return 'not_ready';
  }
  const { refusedIn } = LAUNCH_SURFACES[surface];
  if (refusedIn.ownAppChannel && isOwnAppChannel(context)) {
    return 'already_open';
  }
  if (refusedIn.decoyChannel && isDecoyChannelRun(context)) {
    return 'channel_turned_off';
  }
  return null;
}

async function answerRefusal(context: LaunchContext, surface: EditorLaunchSurface, refusal: LaunchRefusal): Promise<void> {
  recordLaunchEnd(context, `launch_${refusal}`);
  const { translate } = getCachedTranslator(context);
  // the activity being open right there isn't something going wrong
  await replyPrivately(context, translate(familyOf(surface).refusals[refusal]), refusal !== 'already_open');
}

// A launch command's gate (`/editor`, `/games play`, the Launch entry point): true when it was refused and answered,
// nothing's left for the command to do. On top of `launchRefusal`, a channel the server turned NotSoBot off in for a
// user-install run (an activity would post that it started): that one waits, on what the command's checks already
// started and for no longer than they had left (`isBlockedUserInstallRun`), owners skip it without waiting
export async function refuseCommandLaunch(context: Interaction.InteractionContext, surface: EditorLaunchSurface): Promise<boolean> {
  let refusal = launchRefusal(context, surface);
  if (!refusal && await isBlockedUserInstallRun(context)) {
    refusal = 'channel_turned_off';
  }
  if (!refusal) {
    return false;
  }
  await answerRefusal(context, surface, refusal);
  return true;
}


// ---- the launch ----

export type LaunchOutcome =
  // the activity opened and discord said which instance: the launch is stored for it and the channel may hear about it
  {status: 'launched', instanceId: string} |
  // it opened but discord named no instance: nothing can be stored or posted for it, it opens without its context
  {status: 'untracked'} |
  // discord refused it (activities off for this app, a place it can't run): they were told, with the web editor's
  // link where there is one
  {status: 'refused'} |
  // too late for discord to take any answer, nothing was sent and nothing reaches them anymore
  {status: 'expired'};

// how a run that didn't launch goes in the command's usage row, which would say it ran. a press has no row
export function recordLaunchEnd(context: LaunchContext, reason: string): void {
  if (context instanceof Interaction.InteractionContext) {
    setCommandResult(context, CommandResults.CANCELLED);
    setCommandReason(context, reason);
  }
}

// held back by our own guard (utils/interactiondeadline.ts), or discord's Unknown interaction for one that just
// missed the 3 seconds. any other 404 is a refusal like the rest, with its log line and its report
const ERROR_CODE_UNKNOWN_INTERACTION = 10062;

function isExpiredLaunch(error: any): boolean {
  return error instanceof InteractionExpiredError || (!!error && error.code === ERROR_CODE_UNKNOWN_INTERACTION);
}

export interface LaunchOptions {
  surface: EditorLaunchSurface,
  mediaUrl?: string | null,
  templateCode?: string | null,
  inviteCode?: string | null,
  flagGame?: {difficulty: string, code: string | null} | null,
  // `entry_point_join`: whose launch message the Join was on
  joinedUserId?: string | null,
}

// Answers the interaction by launching the activity (it has to be the interaction's first response, so nothing may
// defer it before), then saves where it came from. A launch Discord refuses (activities off for this app, a place it
// can't run) gets the web editor's link instead. Never throws, how it ended is the outcome
export async function launchEditor(context: LaunchContext, options: LaunchOptions): Promise<LaunchOutcome> {
  const surface = LAUNCH_SURFACES[options.surface];
  let instanceId: string | null = null;
  try {
    instanceId = await context.launchActivity();
  } catch(error) {
    if (isExpiredLaunch(error)) {
      // expected on a stalled host or a slow callback (the rest metrics count it), and a reply would be just as late
      recordLaunchEnd(context, 'interaction_expired');
      return {status: 'expired'};
    }
    log.warn('editor activity launch failed', {surface: options.surface, error: (error instanceof Error) ? error.message : String(error)});
    // discord's reason (its error body) ends up in sentry with the surface, a refused launch was only a log line before
    captureError(error, {extra: {surface: options.surface}, tags: {source: 'editor.activity.launch'}});
    recordLaunchEnd(context, 'launch_refused');
    const { translate } = getCachedTranslator(context);
    await replyPrivately(context, translate(surface.refused, {url: editorWebUrl(options.mediaUrl)}), true).catch(() => {});
    return {status: 'refused'};
  }

  if (!instanceId) {
    // never seen with discord's current answer, and silent if it ever starts: `/games play` would open on the choice
    log.warn('editor activity launched without an instance id', {surface: options.surface});
    captureError(new Error('Activity launched without an instance id'), {
      extra: {surface: options.surface},
      fingerprint: ['editor-activity-launch-untracked'],
      tags: {source: 'editor.activity.launch'},
      throttle: 10 * 60 * 1000,
    });
    return {status: 'untracked'};
  }

  if (surface.announces) {
    // the channel hears about it (once per running instance), a failed post changes nothing about the launch
    announceLaunch(context, instanceId, options.surface).catch((error) => {
      log.warn('editor launch message failed', {instanceId, error: (error instanceof Error) ? error.message : String(error)});
    });
  }

  // the launch already happened, a save that never gets there only means the activity opens without its context
  // (whatever its last launch in that instance was, or its first screen)
  storeLaunch(context, instanceId, {
    channelId: context.channelId || null,
    flagGame: options.flagGame || null,
    guildId: context.guildId || null,
    inviteCode: options.inviteCode || null,
    joinedUserId: options.joinedUserId || null,
    locale: context.interaction.locale || null,
    mediaUrl: options.mediaUrl || null,
    surface: options.surface,
    templateCode: options.templateCode || null,
    userId: context.userId,
  }).catch((error) => {
    captureError(error, {extra: {instanceId, surface: options.surface}, tags: {source: 'editor.activity'}});
  });
  return {status: 'launched', instanceId};
}


// The activity reads its launch once, as soon as it has signed in (a few seconds after discord opens it), and the api
// client never resends a write: one dropped connection or a 502 while the api restarts used to lose the launch's
// media, template or invite for good. Storing is a plain overwrite on the api, so it's safe to send again
const STORE_RETRY_DELAYS = [500, 1500];
// `<instance>.<user>` -> their newest launch there being stored: an older one's retry isn't sent once a newer launch
// of theirs started storing (kept on the process, a `.refresh` in between is the same race). An attempt already on
// its way can still land late, like it always could
const storing: Map<string, symbol> = (globalThis as any).notsobotActivityLaunchStores = (globalThis as any).notsobotActivityLaunchStores || new Map();

async function storeLaunch(
  context: LaunchContext,
  instanceId: string,
  launch: RestOptions.StoreEditorActivityLaunch,
): Promise<void> {
  const key = `${instanceId}.${launch.userId}`;
  const token = Symbol();
  storing.set(key, token);
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        await storeEditorActivityLaunch(context, instanceId, launch);
        return;
      } catch(error: any) {
        // a 4xx is the api turning it down, it'd turn the same thing down again
        const status: number | undefined = error && error.response && error.response.statusCode;
        if ((status && status < 500) || STORE_RETRY_DELAYS.length <= attempt) {
          throw error;
        }
        await Timers.sleep(STORE_RETRY_DELAYS[attempt]);
        if (storing.get(key) !== token) {
          return;
        }
      }
    }
  } finally {
    if (storing.get(key) === token) {
      storing.delete(key);
    }
  }
}


// ---- the launch message ----

// one message per running instance: launching where one runs joins it, a second message would only repeat the first.
// per process is enough, a channel's interactions come to its shard's process
const ANNOUNCED_TTL = 6 * 60 * 60 * 1000;
// and one per person per channel this often: an instance ends when its last person leaves, so launching, leaving and
// launching again was a new bot message each time (in their name, past the channel's slowmode)
const ANNOUNCED_USER_TTL = 10 * 60 * 1000;

interface AnnouncementsState {
  // instance id -> when its message was claimed
  instances: Map<string, number>,
  // `<channel>.<user>` -> when theirs was
  users: Map<string, number>,
}

// kept on the process, so a `.refresh` (it reloads this module) doesn't forget which instances already have their
// message and post a second one
const announcements: AnnouncementsState = (globalThis as any).notsobotActivityAnnouncements = (globalThis as any).notsobotActivityAnnouncements || {
  instances: new Map(),
  users: new Map(),
};

// Takes the instance's one message (and the person's for this channel) before it's posted, so two launches into one
// instance at once post one. Gives the function that hands both back when the post didn't happen, null when it's
// already taken
function claimAnnouncement(instanceId: string, channelId: string | null | undefined, userId: string): (() => void) | null {
  const now = Date.now();
  for (let [ id, at ] of announcements.instances) {
    if (ANNOUNCED_TTL < now - at) {
      announcements.instances.delete(id);
    }
  }
  for (let [ key, at ] of announcements.users) {
    if (ANNOUNCED_USER_TTL < now - at) {
      announcements.users.delete(key);
    }
  }
  const userKey = `${channelId || ''}.${userId}`;
  if (announcements.instances.has(instanceId) || announcements.users.has(userKey)) {
    return null;
  }
  announcements.instances.set(instanceId, now);
  announcements.users.set(userKey, now);
  return () => {
    // only its own claim, never one made after this one ran out
    if (announcements.instances.get(instanceId) === now) {
      announcements.instances.delete(instanceId);
    }
    if (announcements.users.get(userKey) === now) {
      announcements.users.delete(userKey);
    }
  };
}


const THREAD_TYPES: Array<number> = [ChannelTypes.GUILD_NEWS_THREAD, ChannelTypes.GUILD_PUBLIC_THREAD, ChannelTypes.GUILD_PRIVATE_THREAD];

// The server's Discord command permissions (Server Settings > Integrations) for the command the launch message names:
// whether NotSoBot, or that command, is turned off in this channel for whoever launched. Discord only applies them to
// the slash command that was run, never to a press, and never to `/editor` when it was Edit Media or the Launch entry
// point that ran. Asked after the launch, when waiting costs nothing. What can't be worked out counts as turned off
async function isCommandTurnedOffHere(context: LaunchContext, family: LaunchFamilyInfo): Promise<boolean> {
  const { guildId, member } = context;
  if (!guildId || !member || !context.isBotPresent || context.user.isClientOwner) {
    // a dm, or a server without the bot: there are no command permissions to go by
    return false;
  }
  const [ topLevelName ] = family.commandName.split(' ');
  const commandId = slashCommandId(context, topLevelName);
  if (context instanceof Interaction.InteractionContext) {
    const data = context.interaction.data as Structures.InteractionDataApplicationCommand | undefined;
    if (commandId && data && data.id === commandId) {
      // the named command is the one that ran: discord applied them itself, or the run's own checks did for a
      // user-install run (`isPrivateRun`)
      return false;
    }
  }
  const channel = context.channel;
  if (!channel) {
    return true;
  }
  await fillApplicationCommandPermissions(context, guildId).catch(() => null);
  const loaded = getApplicationCommandPermissionsLoaded(context, guildId);
  if (loaded === false) {
    // refused: the server's install has no commands scope, a slash run goes ahead the same way. a fetch that only
    // failed says nothing
    return !wasApplicationCommandPermissionsFetchRefused(guildId);
  }
  if (loaded === null) {
    return true;
  }
  return !context.client.applicationCommandPermissions.isAllowed(guildId, (commandId) ? [commandId] : [], channel, member);
}

// Whether the launch message goes up at all, by the same rules that keep the bot's replies private: never where NotSoBot
// is turned off or the decoy channel (`/editor` doesn't launch there anyway), not for someone whose setting is private
// replies (a message only they'd see is pointless), and not where they can't post themselves (a follow-up would post
// where they couldn't). The permissions are the interaction's own, worked out by Discord for this channel. The launch
// already answered, so everything here can wait on the api, and whatever can't be found out means nothing is posted
async function canAnnounce(context: LaunchContext, surface: EditorLaunchSurface): Promise<boolean> {
  const family = familyOf(surface);
  if (isOwnAppChannel(context)) {
    // (only the api's cards launch here at all) the message's Join would answer that it's already open
    return false;
  }
  if (context.guildId && !(await DecoyStore.load(context.client))) {
    // which channels are decoys isn't known (still loading counts as not one everywhere else)
    return false;
  }
  if (context instanceof Interaction.InteractionContext) {
    // (a launch's checks only wait a moment on the api: one that couldn't be made in time means nothing is posted)
    if (areChecksIncomplete(context) || await isPrivateRun(context)) {
      return false;
    }
  } else {
    // a button: no command checks ran for the press, these are a slash run's. the decoy channel, and whoever pressed
    // (blocked by NotSoBot, or not known: the press only looked in memory)
    if (isDecoyChannelRun(context)) {
      return false;
    }
    const user = await UserStore.getOrFetch(context, context.userId);
    if (!user || user.isBlocked) {
      return false;
    }
  }
  // the command the message names, by the server's command permissions and by its rules. a slash run's checks went by
  // its own id, which isn't this one for the Launch entry point or Edit Media, and a press had none (the settings asked
  // of the api if need be)
  if (await isCommandTurnedOffHere(context, family) || await isComponentRuleBlocked(context, family.commandId)) {
    return false;
  }
  // their reply setting: the launch already answered, so waiting on the api here costs nothing (a button never loaded
  // it, a launch command's checks may not have had the time). not known means not posted, the message carries their name
  let settings: Awaited<ReturnType<typeof UserSettingsStore.getOrFetch>> = null;
  try {
    settings = await UserSettingsStore.getOrFetch(context, context.userId);
  } catch {
    return false;
  }
  if (!settings || settings.application_command_response_type === UserSettingsApplicationCommandResponseTypes.EPHEMERAL) {
    return false;
  }
  const member = context.member;
  if (!context.guildId || !member) {
    // a DM or group DM with the user, they can always post there
    return true;
  }
  const permissions = member.permissions;
  if ((permissions & Permissions.ADMINISTRATOR) === Permissions.ADMINISTRATOR) {
    return true;
  }
  const channelType = (context.interaction as any).channel?.type ?? context.channel?.type;
  let needed = (THREAD_TYPES.includes(channelType)) ? Permissions.SEND_MESSAGES_IN_THREADS : Permissions.SEND_MESSAGES;
  if (!context.isBotPresent) {
    // a server without the bot: discord shows a follow-up only to them unless they may use external apps there, and a
    // message nobody else sees would use up the instance's one
    needed |= Permissions.USE_EXTERNAL_APPS;
  }
  return (permissions & needed) === needed;
}


// Posted in the channel after a launch (a follow-up, the launch itself can't carry a message): who's editing, that it's
// `/editor`, and a Join button for everyone else. A games launch (`/games play`, Flag Guesser's Open in Activity) says
// they're playing with `/games play` instead, its Join opens the game rooms and there's no web link. The entry point
// ("Mess Around") opens on the choice, so its message only says they're in NotSoBot (`launched`) and its Join opens on
// the choice too (`joinsWith`). Nobody's pinged
export async function announceLaunch(
  context: LaunchContext,
  instanceId: string,
  surface: EditorLaunchSurface = 'command',
): Promise<void> {
  if (!await canAnnounce(context, surface)) {
    return;
  }
  // (nothing is awaited between the last check and the claim: of two launches into one instance, one posts)
  const release = claimAnnouncement(instanceId, context.channelId, context.userId);
  if (!release) {
    return;
  }
  try {
    const { translate } = await getTranslator(context);
    const name = context.member?.nick || context.user.globalName || context.user.username;
    const family = familyOf(surface);
    const games = isGamesSurface(surface);
    const joinsWith = LAUNCH_SURFACES[surface].joinsWith;
    // clickable where the command client's ids are known (slash and context menus), the plain name from a button
    const command = (context instanceof Interaction.InteractionContext) ? slashCommandMention(context, family.commandName) : Markup.codestring(`/${family.commandName}`);
    const buttons: Array<any> = [
      {
        type: MessageComponentTypes.BUTTON,
        style: MessageComponentButtonStyles.PRIMARY,
        label: translate('editor_activity.join'),
        customId: (joinsWith) ? `${joinsWith}.${context.userId}` : ((games) ? MessageComponentCustomIds.GAMES_JOIN : MessageComponentCustomIds.EDITOR_JOIN),
      },
    ];
    if (!games) {
      buttons.push({
        type: MessageComponentTypes.BUTTON,
        style: MessageComponentButtonStyles.LINK,
        label: translate('editor_activity.open_web'),
        url: EDITOR_WEB_URL,
      });
    }
    await context.createMessage({
      allowedMentions: {parse: []},
      content: translate(LAUNCH_SURFACES[surface].launched ?? family.launched, {name: Markup.escape.all(name), command}),
      components: [{type: MessageComponentTypes.ACTION_ROW, components: buttons}],
    } as any);
  } catch(error) {
    // not posted: the next launch into the instance gets to. (kept, it used to stay silent for 6 hours)
    release();
    throw error;
  }
}


// ---- the buttons ----

// A press skips everything a command's checks do (`onCommandCheck`), so the buttons below ask what's in memory first
// (`checkComponentAccess`, never the api: the launch has to answer within 3 seconds). Someone NotSoBot blocked, or
// pressing in a server it blocked, is told so like a command would and nothing launches. Staff warnings they haven't
// seen take the press's place like they take a command's, they press again after reading them. True when one of those
// was the answer. One of the server's own rules against the command doesn't stop the launch (a command blocked that way
// still runs, privately): it only keeps the launch message out of the channel (`canAnnounce`)
async function refuseBlockedPress(context: ComponentContext, commandId: string): Promise<boolean> {
  const access = checkComponentAccess(context, commandId);
  if (access.blocked) {
    await replyPrivately(context, access.blocked, true);
    return true;
  }
  if (access.warnings) {
    await answerWarningsPending(context, access.warnings);
    return true;
  }
  return false;
}

// A launcher button's gate: the surface's own (`launchRefusal`), then whoever pressed. True when it was refused and
// answered. From memory only, nothing may wait before the launch (3 seconds)
async function refusePress(context: ComponentContext, surface: EditorLaunchSurface): Promise<boolean> {
  const refusal = launchRefusal(context, surface);
  if (refusal) {
    await answerRefusal(context, surface, refusal);
    return true;
  }
  return refuseBlockedPress(context, familyOf(surface).commandId);
}

// A launcher button's press: the gate, then the launch. Answered by launching
async function pressLaunch(context: ComponentContext, options: LaunchOptions): Promise<void> {
  if (await refusePress(context, options.surface)) {
    return;
  }
  await launchEditor(context, options);
}

// Open in Activity on a Flag Guesser message: its rooms, with a room continuing the game it was pressed on (its
// difficulty, and its flag while nobody's answered it). A flag that goes along leaves the chat: the round there is held
// while the launch is tried (no guess or skip counts meanwhile) and ends as moved once the activity opened for an
// instance (its launch, carrying the flag, is stored for it), or goes on as before when it didn't open (refused,
// expired) or opened without one. Read from memory, the launch has to answer within 3 seconds
async function pressFlagGuesser(context: ComponentContext): Promise<void> {
  if (await refusePress(context, 'flag_guesser')) {
    return;
  }
  const carry = GameFlag.takeFlagGuesserCarry(context.interaction.message?.id, context.user);
  let moved = false;
  try {
    const outcome = await launchEditor(context, {surface: 'flag_guesser', flagGame: (carry) ? carry.flagGame : null});
    moved = outcome.status === 'launched';
  } finally {
    if (carry) {
      carry.settle(moved);
    }
  }
}

// Try it on a template card the api posted ("Post in chat" in the activity): the activity in that channel, opened on the
// template's steps
async function pressTemplate(context: ComponentContext, value: string): Promise<void> {
  const templateCode = editorTemplateCodeOf(value);
  if (!templateCode) {
    await replyPrivately(context, getCachedTranslator(context).translate('editor_activity.bad_template'), true);
    return;
  }
  return pressLaunch(context, {surface: 'template_post', templateCode});
}

// a user id on the entry point's Join (`entry-point-join.<user id>`)
const SNOWFLAKE = /^[0-9]{15,21}$/;

// a room invite's code (notsobot.api `invites.py`: `secrets.token_urlsafe(9)`), whether it's still good is the
// activity's to find out when it redeems it
const INVITE_CODE = /^[A-Za-z0-9_-]{12}$/;

// Join on a room invite's card the api posted (the activity's "Post in this channel"): the activity in that channel,
// opened in the invite's room, an editor lobby or a game room. No launch message, the card already says who's in there
async function pressInvite(context: ComponentContext, value: string): Promise<void> {
  if (!INVITE_CODE.test(value)) {
    await replyPrivately(context, getCachedTranslator(context).translate('activity_invite.invalid'), true);
    return;
  }
  return pressLaunch(context, {surface: 'invite', inviteCode: value});
}

/**
 * The press handler of a launcher button, null for any other custom id (found without waiting on anything, the
 * components listener asks for every press):
 * - `editor-join`: the launch message's Join, the activity in that channel (the running one, Discord joins it)
 * - `entry-point-join.<user id>`: an entry point launch message's Join, the same opened on the editor-or-games choice
 *   with the launcher (that user id) first under "Jump in with someone"
 * - `games-join`: the `/games play` launch message's Join, the same opened on its game rooms
 * - `flag-guesser-activity`: Open in Activity on Flag Guesser's messages in chat, straight on its rooms and posting the
 *   same launch message as `/games play`
 * - `editor-template.<code>` and `activity-invite.<code>`: the api's cards
 */
export function launchButtonOf(customId: string): ((context: ComponentContext) => Promise<void>) | null {
  switch (customId) {
    case MessageComponentCustomIds.EDITOR_JOIN: return (context) => pressLaunch(context, {surface: 'join'});
    case MessageComponentCustomIds.GAMES_JOIN: return (context) => pressLaunch(context, {surface: 'games_join'});
    case MessageComponentCustomIds.FLAG_GUESSER_ACTIVITY: return pressFlagGuesser;
  }
  const dot = customId.indexOf('.');
  if (dot === -1) {
    return null;
  }
  const value = customId.slice(dot + 1);
  switch (customId.slice(0, dot)) {
    case MessageComponentCustomIds.EDITOR_TEMPLATE: return (context) => pressTemplate(context, value);
    case MessageComponentCustomIds.ACTIVITY_INVITE: return (context) => pressInvite(context, value);
    case MessageComponentCustomIds.ENTRY_POINT_JOIN: return (context) => pressLaunch(context, {
      surface: 'entry_point_join',
      // only a hint for the order of the choice's rows, a made-up one changes nothing else
      joinedUserId: (SNOWFLAKE.test(value)) ? value : null,
    });
  }
  return null;
}

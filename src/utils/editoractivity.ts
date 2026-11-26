import { Interaction, Structures } from 'detritus-client';
import { ChannelTypes, InteractionCallbackTypes, MessageComponentButtonStyles, MessageComponentTypes, Permissions } from 'detritus-client/lib/constants';
import { ComponentContext, Markup } from 'detritus-client/lib/utils';

import { storeEditorActivityLaunch } from '../api';
import type { RestOptions } from '../api/types';
import { EmbedColors, MessageComponentCustomIds, UserSettingsApplicationCommandResponseTypes } from '../constants';
import UserSettingsStore from '../stores/usersettings';
// a cycle (basecommand imports this module), fine for a function only called at runtime, never copied at load
import { isPrivateRun } from '../commands/interactions/basecommand';
import { log } from '../log';
import { captureError } from '../sentry';

import { getTranslator } from './i18n';
import { displayReply, renderEphemeralDisplay, slashCommandMention } from './tools';


// The media editor's Discord Activity: launching it from the "Launch" entry point or Edit Media's "Open editor", and
// telling the api what it was launched on. The activity reads that back once it knows its instance id
// (`GET /editor/activity/<instance_id>`), it can't read the channel's messages itself


export const EDITOR_WEB_URL = 'https://notsobot.com/editor';

export type EditorLaunchSurface = RestOptions.StoreEditorActivityLaunch['surface'];

// `/games` and its Join: the same activity, opened on its game rooms instead of the editor
const GAMES_SURFACES: ReadonlyArray<EditorLaunchSurface> = ['games', 'games_join'];
// the launch message's own Join buttons, they never post another one, and an invite's Join (the card is its message)
const JOIN_SURFACES: ReadonlyArray<EditorLaunchSurface> = ['join', 'games_join', 'invite'];

export function isGamesSurface(surface: EditorLaunchSurface): boolean {
  return GAMES_SURFACES.includes(surface);
}

type LaunchContext = Interaction.InteractionContext | ComponentContext;


// everyone (public since 2026-11-25), or only NotSoBot owners with `NOTSOBOT_EDITOR_PUBLIC=false`, set together with the
// api's `EDITOR_PUBLIC=false` (its `/editor` routes and the site's page go by that one)
export function canUseEditor(context: {user: Structures.User}): boolean {
  return process.env.NOTSOBOT_EDITOR_PUBLIC !== 'false' || context.user.isClientOwner;
}


// the site's editor, opened on `mediaUrl` when there's one
export function editorWebUrl(mediaUrl?: string | null): string {
  return (mediaUrl) ? `${EDITOR_WEB_URL}?url=${encodeURIComponent(mediaUrl)}` : EDITOR_WEB_URL;
}


// a template's code from its share link (`notsobot.com/editor/template/<code>`, `/es/` and `/pt/` too) or the bare code:
// its id in letters (A-Z then a-z, at most 12 for a bigint), the api's `shortcode.py`
const TEMPLATE_CODE = /^[A-Za-z]{1,12}$/;

export function editorTemplateCodeOf(value: string): string | null {
  const text = value.trim().replace(/^<(.*)>$/, '$1');
  if (TEMPLATE_CODE.test(text)) {
    return text;
  }
  try {
    const url = new URL(text);
    const host = url.hostname.replace(/^www\./, '');
    const match = url.pathname.match(/^(?:\/[a-z]{2})?\/editor\/template\/([A-Za-z]{1,12})\/?$/);
    return (host === 'notsobot.com' && match) ? match[1] : null;
  } catch {
    return null;
  }
}


export async function replyPrivately(context: LaunchContext, description: string, error: boolean = false) {
  if (context instanceof ComponentContext) {
    const translator = await getTranslator(context);
    return context.respond(
      InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE,
      renderEphemeralDisplay(context, translator, {color: (error) ? EmbedColors.ERROR : undefined, description}),
    );
  }
  return displayReply(context, {color: (error) ? EmbedColors.ERROR : undefined, description, ephemeral: true});
}


// Answers the interaction by launching the activity (it has to be the interaction's first response, so nothing may
// defer it before), then saves where it came from. A launch Discord refuses (activities off for this app, a place it
// can't run) gets the web editor's link instead. Returns the instance id
export async function launchEditor(
  context: LaunchContext,
  options: {surface: EditorLaunchSurface, mediaUrl?: string | null, templateCode?: string | null, inviteCode?: string | null},
): Promise<string | null> {
  let instanceId: string | null = null;
  try {
    instanceId = await context.launchActivity();
  } catch(error) {
    log.warn('editor activity launch failed', {surface: options.surface, error: (error instanceof Error) ? error.message : String(error)});
    // discord's reason (its error body) ends up in sentry with the surface, a refused launch was only a log line before
    captureError(error, {extra: {surface: options.surface}, tags: {source: 'editor.activity.launch'}});
    const { translate } = await getTranslator(context);
    // the games have no web version to send them to, and an invite's room (either kind) is only in the activity
    let text: string;
    if (options.surface === 'invite') {
      text = translate('activity_invite.launch_failed');
    } else if (isGamesSurface(options.surface)) {
      text = translate('games_activity.launch_failed');
    } else {
      text = translate('editor_activity.launch_failed', {url: editorWebUrl(options.mediaUrl)});
    }
    await replyPrivately(context, text, true).catch(() => {});
    return null;
  }

  if (instanceId && !JOIN_SURFACES.includes(options.surface)) {
    // the channel hears about it (once per running instance), a failed post changes nothing about the launch
    announceLaunch(context, instanceId, options.surface).catch((error) => {
      log.warn('editor launch message failed', {instanceId, error: (error instanceof Error) ? error.message : String(error)});
    });
  }

  if (instanceId) {
    // the launch already happened, a failed save only means the editor opens on its start screen
    storeEditorActivityLaunch(context, instanceId, {
      channelId: context.channelId || null,
      guildId: context.guildId || null,
      inviteCode: options.inviteCode || null,
      locale: context.interaction.locale || null,
      mediaUrl: options.mediaUrl || null,
      surface: options.surface,
      templateCode: options.templateCode || null,
      userId: context.userId,
    }).catch((error) => {
      captureError(error, {extra: {instanceId, surface: options.surface}, tags: {source: 'editor.activity'}});
    });
  }
  return instanceId;
}


// ---- the launch message ----

// one message per running instance: launching where one runs joins it, a second message would only repeat the first.
// per process is enough, a channel's interactions come to its shard's process
const ANNOUNCED_TTL = 6 * 60 * 60 * 1000;
const announced = new Map<string, number>();

function claimAnnouncement(instanceId: string): boolean {
  const now = Date.now();
  for (let [ id, at ] of announced) {
    if (ANNOUNCED_TTL < now - at) {
      announced.delete(id);
    }
  }
  if (announced.has(instanceId)) {
    return false;
  }
  announced.set(instanceId, now);
  return true;
}


const THREAD_TYPES: Array<number> = [ChannelTypes.GUILD_NEWS_THREAD, ChannelTypes.GUILD_PUBLIC_THREAD, ChannelTypes.GUILD_PRIVATE_THREAD];

// Whether the launch message goes up at all, by the same rules that keep the bot's replies private: never where NotSoBot
// is turned off or the decoy channel (`/editor` doesn't launch there anyway), not for someone whose setting is private
// replies (a message only they'd see is pointless), and not where they can't post themselves (a follow-up would post
// where they couldn't). The permissions are the interaction's own, worked out by Discord for this channel
async function canAnnounce(context: LaunchContext): Promise<boolean> {
  if (context instanceof Interaction.InteractionContext) {
    if (await isPrivateRun(context)) {
      return false;
    }
  } else {
    const settings = UserSettingsStore.get(context.userId);
    if (settings && settings.application_command_response_type === UserSettingsApplicationCommandResponseTypes.EPHEMERAL) {
      return false;
    }
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
  const needed = (THREAD_TYPES.includes(channelType)) ? Permissions.SEND_MESSAGES_IN_THREADS : Permissions.SEND_MESSAGES;
  return (permissions & needed) === needed;
}


// Posted in the channel after a launch (a follow-up, the launch itself can't carry a message): who's editing, that it's
// `/editor`, and a Join button for everyone else. A `/games` launch says they're playing with `/games` instead, its Join
// opens the game rooms and there's no web link. Nobody's pinged
export async function announceLaunch(
  context: LaunchContext,
  instanceId: string,
  surface: EditorLaunchSurface = 'command',
): Promise<void> {
  if (!await canAnnounce(context) || !claimAnnouncement(instanceId)) {
    return;
  }
  const { translate } = await getTranslator(context);
  const name = context.member?.nick || context.user.globalName || context.user.username;
  const games = isGamesSurface(surface);
  const commandName = (games) ? 'games' : 'editor';
  // clickable where the command client's ids are known (slash and context menus), the plain name from a button
  const command = (context instanceof Interaction.InteractionContext) ? slashCommandMention(context, commandName) : Markup.codestring(`/${commandName}`);
  const buttons: Array<any> = [
    {
      type: MessageComponentTypes.BUTTON,
      style: MessageComponentButtonStyles.PRIMARY,
      label: translate('editor_activity.join'),
      customId: (games) ? MessageComponentCustomIds.GAMES_JOIN : MessageComponentCustomIds.EDITOR_JOIN,
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
    content: (games) ?
      translate('games_activity.launched', {name: Markup.escape.all(name), command}) :
      translate('editor_activity.launched', {name: Markup.escape.all(name), command}),
    components: [{type: MessageComponentTypes.ACTION_ROW, components: buttons}],
  } as any);
}


// the launch message's Join: the activity in that channel (the running one, Discord joins it). answered by launching,
// nothing may await before it (3 seconds)
export async function onEditorJoin(context: ComponentContext): Promise<void> {
  if (!canUseEditor(context)) {
    const { translate } = await getTranslator(context);
    await replyPrivately(context, translate('editor_activity.not_ready'), true);
    return;
  }
  await launchEditor(context, {surface: 'join'});
}


// the `/games` launch message's Join: the activity in that channel, opened on its game rooms. answered by launching,
// nothing may await before it (3 seconds)
export async function onGamesJoin(context: ComponentContext): Promise<void> {
  if (!canUseEditor(context)) {
    const { translate } = await getTranslator(context);
    await replyPrivately(context, translate('games_activity.not_ready'), true);
    return;
  }
  await launchEditor(context, {surface: 'games_join'});
}


// Try it on a template card the api posted ("Post in chat" in the activity): the activity in that channel, opened on the
// template's steps. answered by launching, nothing may await before it (3 seconds)
export async function onEditorTemplate(context: ComponentContext, value: string): Promise<void> {
  const templateCode = editorTemplateCodeOf(value);
  if (!canUseEditor(context) || !templateCode) {
    const { translate } = await getTranslator(context);
    await replyPrivately(context, translate('editor_activity.not_ready'), true);
    return;
  }
  await launchEditor(context, {surface: 'template_post', templateCode});
}


// a room invite's code (notsobot.api `invites.py`: `secrets.token_urlsafe(9)`), whether it's still good is the
// activity's to find out when it redeems it
const INVITE_CODE = /^[A-Za-z0-9_-]{12}$/;

// Join on a room invite's card the api posted (the activity's "Post in this channel"): the activity in that channel,
// opened in the invite's room, an editor lobby or a game room. answered by launching, nothing may await before it (3
// seconds). No launch message, the card already says who's in there
export async function onActivityInvite(context: ComponentContext, value: string): Promise<void> {
  if (!canUseEditor(context) || !INVITE_CODE.test(value)) {
    const { translate } = await getTranslator(context);
    const text = (INVITE_CODE.test(value)) ? translate('editor_activity.not_ready') : translate('activity_invite.invalid');
    await replyPrivately(context, text, true);
    return;
  }
  await launchEditor(context, {surface: 'invite', inviteCode: value});
}

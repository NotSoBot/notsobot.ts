import { Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { ComponentContext } from 'detritus-client/lib/utils';

import { storeEditorActivityLaunch } from '../api';
import type { RestOptions } from '../api/types';
import { EmbedColors } from '../constants';
import { log } from '../log';
import { captureError } from '../sentry';

import { getTranslator } from './i18n';
import { displayReply, renderEphemeralDisplay } from './tools';


// The media editor's Discord Activity: launching it from the "Launch" entry point or Edit Media's "Open editor", and
// telling the api what it was launched on. The activity reads that back once it knows its instance id
// (`GET /editor/activity/<instance_id>`), it can't read the channel's messages itself


export const EDITOR_WEB_URL = 'https://notsobot.com/editor';

export type EditorLaunchSurface = RestOptions.StoreEditorActivityLaunch['surface'];

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
  options: {surface: EditorLaunchSurface, mediaUrl?: string | null, templateCode?: string | null},
): Promise<string | null> {
  let instanceId: string | null = null;
  try {
    instanceId = await context.launchActivity();
  } catch(error) {
    log.warn('editor activity launch failed', {surface: options.surface, error: (error instanceof Error) ? error.message : String(error)});
    // discord's reason (its error body) ends up in sentry with the surface, a refused launch was only a log line before
    captureError(error, {extra: {surface: options.surface}, tags: {source: 'editor.activity.launch'}});
    const { translate } = await getTranslator(context);
    await replyPrivately(context, translate('editor_activity.launch_failed', {url: editorWebUrl(options.mediaUrl)}), true).catch(() => {});
    return null;
  }

  if (instanceId) {
    // the launch already happened, a failed save only means the editor opens on its start screen
    storeEditorActivityLaunch(context, instanceId, {
      channelId: context.channelId || null,
      guildId: context.guildId || null,
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

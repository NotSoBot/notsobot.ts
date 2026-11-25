import { Interaction, Structures } from 'detritus-client';
import {
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageComponentInputTextStyles,
  MessageFlags,
} from 'detritus-client/lib/constants';
import {
  ComponentActionRow,
  ComponentContext,
  Components,
  InteractionModal,
  InteractionModalArgs,
  InteractionModalContext,
} from 'detritus-client/lib/utils';

import { EmbedColors } from '../../../constants';
import { Parameters, displayReply, findMediaUrlInMessages, renderEphemeralDisplay } from '../../../utils';
import { TranslationKey, getTranslator } from '../../i18n';
import { EditorLaunchSurface, launchEditor } from '../../editoractivity';

import * as MediaAIVPipe from './media.aiv.pipe';
import { replyPageError } from './tools.download';


export const COMMAND_ID = 'media.aiv.edit';

export type MediaKind = 'audio' | 'image' | 'video';

export interface CommandArgs {
  // the results only show to whoever used it, like the menu (their response setting, or NotSoBot's turned off here)
  isPrivate?: boolean,
  // offers "Open editor" (the media editor activity), from where. unset where it can't open (`canLaunchEditorHere`)
  editorSurface?: EditorLaunchSurface,
  // which menus fit the media
  kind: MediaKind,
  url: string,
}

// what the menus offer: pipe commands that need no options, shown by the name Custom takes them by. a select menu
// holds 25
const EFFECTS: ReadonlyArray<string> = Object.freeze([
  'magik',
  'deepfry',
  'glitch',
  'explode',
  'implode',
  'swirl',
  'fisheye',
  'wobble',
  'globe',
  'spin',
  'triggered',
  'rainbow',
  'vaporwave',
  'needsmorejpeg',
  'pixelate',
  'acid',
  'datamosh',
  'wave',
  'shake',
  'bounce',
  'wiggle',
  'oldtv',
  'vhs',
  'glow',
  'paint',
]);
const ADJUSTMENTS: ReadonlyArray<string> = Object.freeze([
  'flip',
  'flop',
  'mirror left',
  'mirror right',
  'mirror top',
  'mirror bottom',
  'invert',
  'grayscale',
  'sepia',
  'blur',
  'sharpen',
  'background remove',
  'crop auto',
  'crop circle',
  'togif',
]);
const AUDIO_EFFECTS: ReadonlyArray<string> = Object.freeze([
  'boost bass',
  'audio reverb',
  'audio chorus',
  'audio distortion',
  'audio destroy',
  'audio vibrato',
  'audio tremolo',
  'audio flanger',
  'audio bitcrush',
  'audio wahwah',
  'audio pingpong',
  'audio delay',
  'audio gapper',
  'audio autotune',
  'audio normalize',
]);
// only for something that plays
const REVERSE = 'reverse';

// a menu's placeholder and its commands, by what the media is
function getMenus(kind: MediaKind): Array<[TranslationKey, ReadonlyArray<string>]> {
  switch (kind) {
    case 'audio': return [['media_edit_pick.audio', [...AUDIO_EFFECTS, REVERSE]]];
    case 'image': return [['media_edit_pick.effects', EFFECTS], ['media_edit_pick.adjust', ADJUSTMENTS]];
    case 'video': return [
      ['media_edit_pick.effects', EFFECTS],
      ['media_edit_pick.adjust', [...ADJUSTMENTS, REVERSE]],
      ['media_edit_pick.audio', AUDIO_EFFECTS],
    ];
  }
}

// the menu is the command's own response, edited through its interaction token (gone after 15 minutes)
const MENU_TIMEOUT = 10 * 60 * 1000;
const CUSTOM_INPUT_ID = 'commands';
const CUSTOM_MAX_LENGTH = 500;
// command names aren't translated
const CUSTOM_PLACEHOLDER = 'caption hello; flip';

// idle: waiting for a pick. running: a pick's job is going, others are ignored until it's done. expired: timed out,
// the menu's gone (a pick still running finishes)
type MenuState = 'idle' | 'running' | 'expired';


// the message's media and which kind it is, null without any
export function findMedia(message: Structures.Message): {kind: MediaKind, url: string} | null {
  const url = findMediaUrlInMessages([message]);
  if (!url) {
    return null;
  }
  // the same search with only one kind allowed finds it again when it's that kind. a link that could be anything
  // gets every menu
  let kind: MediaKind = 'video';
  if (findMediaUrlInMessages([message], {audio: false, video: false}) === url) {
    kind = 'image';
  } else if (findMediaUrlInMessages([message], {image: false, video: false}) === url) {
    kind = 'audio';
  }
  return {kind, url};
}


// a menu only whoever used the command sees: each pick (or what they type into Custom) runs as a pipe on the media and
// is posted as its own message, for everyone unless `isPrivate`. The menu stays to pick another
export async function createMessage(context: Interaction.InteractionContext, args: CommandArgs) {
  const translator = await getTranslator(context);
  const { translate } = translator;

  let state: MenuState = 'idle';

  const respondEphemeral = (ctx: ComponentContext | InteractionModalContext, description: string) => {
    return ctx.respond(
      InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE,
      renderEphemeralDisplay(ctx, translator, {color: EmbedColors.ERROR, description}),
    );
  };

  const run = async (ctx: ComponentContext | InteractionModalContext, text: string) => {
    if (state === 'expired') {
      // a modal opened right before the menu went
      return respondEphemeral(ctx, translate('media_edit_pick.timed_out')).catch(() => {});
    }
    if (state !== 'idle' || ctx.userId !== context.userId || !text) {
      return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE).catch(() => {});
    }

    let commands: Array<Parameters.PipingCommand>;
    try {
      commands = await Parameters.pipingCommands(text, context);
    } catch(error) {
      // not a media command, or options it doesn't take: nothing's posted for it
      return respondEphemeral(ctx, String(error.message || error)).catch(() => {});
    }

    state = 'running';
    try {
      await ctx.respond(
        InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        (args.isPrivate) ? {flags: MessageFlags.EPHEMERAL} : undefined,
      );
      // "took" counts from the pick, not from when the menu was opened
      context.metadata = context.metadata || {};
      context.metadata.started = Date.now();
      await MediaAIVPipe.createMessage(context, {commands, url: args.url}, ctx);
    } catch(error) {
      // the thinking message goes, why it failed only shows to them
      await ctx.deleteResponse().catch(() => {});
      await replyPageError(ctx, context, translator, error);
    } finally {
      // the cast undoes the narrowing to `running`, the menu can time out during the job
      if ((state as MenuState) === 'running') {
        state = 'idle';
      }
    }
  };

  const onPick = (ctx: ComponentContext) => run(ctx, (ctx.data.values || [])[0] || '');

  const onCustom = async (ctx: ComponentContext) => {
    if (state !== 'idle' || ctx.userId !== context.userId) {
      return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE).catch(() => {});
    }
    const modal = new InteractionModal({
      timeout: MENU_TIMEOUT,
      title: translate('commands.context.edit_media.name'),
      run: (modalContext: InteractionModalContext, modalArgs: InteractionModalArgs) => {
        return run(modalContext, String(modalArgs[CUSTOM_INPUT_ID] || '').trim());
      },
    });
    modal.createLabel({
      description: translate('media_edit_pick.custom_description'),
      label: translate('media_edit_pick.custom_label'),
    }).createInputText({
      customId: CUSTOM_INPUT_ID,
      maxLength: CUSTOM_MAX_LENGTH,
      placeholder: CUSTOM_PLACEHOLDER,
      required: true,
      style: MessageComponentInputTextStyles.SHORT,
    });
    return ctx.respond(modal);
  };

  const components = new Components({
    timeout: MENU_TIMEOUT,
    onTimeout: async () => {
      state = 'expired';
      await displayReply(context, {description: translate('media_edit_pick.timed_out'), ephemeral: true}).catch(() => {});
    },
  });
  for (let [placeholderKey, commands] of getMenus(args.kind)) {
    const row = new ComponentActionRow();
    row.createSelectMenu({
      options: commands.map((command) => ({label: command, value: command})),
      placeholder: translate(placeholderKey),
      run: onPick,
    });
    components.addActionRow(row);
  }
  const buttons = components.createActionRow();
  buttons.createButton({
    label: translate('media_edit_pick.custom'),
    run: onCustom,
    style: MessageComponentButtonStyles.SECONDARY,
  });
  if (args.editorSurface) {
    const surface = args.editorSurface;
    // the media editor activity on this media, launched in this channel by the button's interaction
    buttons.createButton({
      label: translate('media_edit_pick.open_editor'),
      run: async (ctx: ComponentContext) => {
        if (state === 'expired' || ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE).catch(() => {});
        }
        await launchEditor(ctx, {surface, mediaUrl: args.url});
      },
      style: MessageComponentButtonStyles.PRIMARY,
    });
  }

  return displayReply(context, {
    components,
    componentsInside: true,
    description: translate('media_edit_pick.prompt'),
    ephemeral: true,
    note: (args.isPrivate) ? undefined : translate('media_edit_pick.public_note'),
  });
}

import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { ComponentActionRow, ComponentContext, Components } from 'detritus-client/lib/utils';

import { mediaIVManipulationEyes } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import type { RestOptions } from '../../../api/types';
import { MediaEyeTypes, StatusEmojis } from '../../../constants';
import { CommandRunCancelledError, DefaultParameters, displayReply, jobReply } from '../../../utils';
import { TranslationKey, Translator, getTranslator } from '../../i18n';


export const COMMAND_ID = 'media.iv.manipulation.eyes';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'eyes',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'eyes img EYE',
    'render img image/webp',
  ].join('\n'),
};

// the drawn eye types get their own `/eyes laser` and `/eyes lightning` (and the picker's second menu), the stickers
// are the rest. all of them together are over discord's 25 choices (or select menu options)
function eyeTypesStartingWith(prefix: string): Record<string, MediaEyeTypes> {
  return Object.fromEntries(Object.entries(MediaEyeTypes).filter(([key]) => key.startsWith(prefix)));
}

export const EYES_LASER_TYPES = eyeTypesStartingWith('LASER_');
export const EYES_LIGHTNING_TYPES = eyeTypesStartingWith('LIGHTNING_');
export const EYES_STICKER_TYPES = Object.fromEntries(
  Object.entries(MediaEyeTypes).filter(([key]) => !(key in EYES_LASER_TYPES) && !(key in EYES_LIGHTNING_TYPES)),
) as Record<string, MediaEyeTypes>;

// how long the picker waits before anything's rendered, and under a result
const PICK_TIMEOUT = 2 * 60 * 1000;
const RESULT_PICK_TIMEOUT = 5 * 60 * 1000;

export interface CommandArgs {
  flipped?: boolean,
  type?: MediaEyeTypes,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationEyes(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}


// a row each for the stickers and the drawn ones (lasers and lightning), `current` shown as picked
function createPickerRows(
  { translate, translateMaybe }: Translator,
  current: MediaEyeTypes | undefined,
  run: (ctx: ComponentContext) => Promise<unknown>,
): Array<ComponentActionRow> {
  const groups: Array<[TranslationKey, Array<MediaEyeTypes>]> = [
    ['media_eyes_pick.stickers', Object.values(EYES_STICKER_TYPES)],
    ['media_eyes_pick.drawn', [...Object.values(EYES_LASER_TYPES), ...Object.values(EYES_LIGHTNING_TYPES)]],
  ];
  return groups.map(([placeholderKey, types]) => {
    const row = new ComponentActionRow();
    row.createSelectMenu({
      options: types.map((type) => ({
        default: type === current,
        label: translateMaybe(`choices.media_eye_types.${type.toLowerCase()}`, type),
        value: type,
      })),
      placeholder: translate(placeholderKey),
      run,
    });
    return row;
  });
}

// prefix `.eyes`: without a type it asks for one first, and every result has the picker under it to try another on the
// same media. Only whoever ran it can pick
export async function createPickerMessage(context: Command.Context, args: CommandArgs) {
  const translator = await getTranslator(context);
  const { translate, translateMaybe } = translator;

  // goes up with each pick, a result's picker only times out (and goes) while nothing newer was picked
  let picks = 0;
  let rendering = false;

  const render = async (type: MediaEyeTypes) => {
    const shownAt = picks;
    const job = await createJob(context, {...args, type});
    return jobReply(context, job, {
      actions: {
        rows: createPickerRows(translator, type, onPick),
        timeout: RESULT_PICK_TIMEOUT,
        onTimeout: (strip) => (picks === shownAt) ? strip().catch(() => {}) : undefined,
      },
    });
  };

  const onPick = async (ctx: ComponentContext) => {
    const type = (ctx.data.values || [])[0] as MediaEyeTypes | undefined;
    if (ctx.userId !== context.userId || rendering || !type || !Object.values(MediaEyeTypes).includes(type)) {
      return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE).catch(() => {});
    }
    picks++;
    rendering = true;
    try {
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      // "took" counts from the pick, not from when the command was run
      context.metadata = context.metadata || {};
      context.metadata.started = Date.now();
      await render(type);
    } catch(error) {
      if (error instanceof CommandRunCancelledError) {
        return;
      }
      // the job couldn't start (like the api rejecting the media), shown in place of the picker
      const apiError = await getApiError(error);
      let description: string;
      if (apiError) {
        const key = getApiErrorTranslationKey(apiError.code);
        description = (key) ? translateMaybe(key, apiError.message) : apiError.message;
      } else {
        description = String(error.message || error);
      }
      await displayReply(context, {description: `${StatusEmojis.WARNING} ${description}`}).catch(() => {});
    } finally {
      rendering = false;
    }
  };

  if (args.type) {
    return render(args.type);
  }

  const components = new Components({
    timeout: PICK_TIMEOUT,
    onTimeout: async () => {
      if (picks) {
        return;
      }
      await displayReply(context, {description: translate('media_eyes_pick.timed_out')}).catch(() => {});
    },
  });
  for (let row of createPickerRows(translator, undefined, onPick)) {
    components.addActionRow(row);
  }
  return displayReply(context, {
    components,
    componentsInside: true,
    description: translate('media_eyes_pick.prompt'),
  });
}

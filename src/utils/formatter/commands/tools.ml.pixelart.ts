import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentActionRow, ComponentContext } from 'detritus-client/lib/utils';

import { utilitiesMLPixelart } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { StatusEmojis } from '../../../constants';
import { displayLinks, displayReply, jobReply, jobWaitForResponse, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.ml.pixelart';

// the model behind it, credited under every result (their card asks for "Tessera by Jagrat Patel (TheJagStudio)")
const MODEL_CREDIT = 'Tessera by Jagrat Patel (TheJagStudio)';
const MODEL_URL = 'https://huggingface.co/thejagstudio/tessera-small';

export const CREDITS = [{name: 'Jagrat Patel (TheJagStudio)', url: MODEL_URL}];

// the api's grid is 2x2, sprite i is made from `seed + i` so a pick makes the same one again alone and bigger
const GRID_COUNT = 4;
// what the api takes, it adds up to 3 to it
const SEED_MAX = 2 ** 32;
const PICK_TIMEOUT = 5 * 60 * 1000;

export interface CommandArgs {
  query: string,
  seed?: number,
}

function creditLine(): string {
  return displayLinks([[MODEL_CREDIT, MODEL_URL]]);
}

const replyCredit = {
  describeBelow: creditLine,
  describeEmbedFooter: () => ({text: MODEL_CREDIT}),
};

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // picked here (not by the api) so the buttons know it before the grid is back
  const seed = (args.seed !== undefined) ? args.seed : 1 + Math.floor(Math.random() * (SEED_MAX - 1));
  const job = await utilitiesMLPixelart(context, {query: args.query, safe: true, seed});

  // each sprite once, only for whoever made the grid, every pick is its own message
  const picked = new Set<number>();
  const onPick = async (ctx: ComponentContext, index: number) => {
    if (ctx.userId !== context.userId || picked.has(index)) {
      return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE).catch(() => {});
    }
    picked.add(index);
    // deferred first so the new message (not the grid) is the one the response's listener is keyed to
    await ctx.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
    try {
      // sent as the original command, so the api sees who ran it and which command
      const pick = await utilitiesMLPixelart(context, {query: args.query, safe: true, seed, index});
      const response = await jobWaitForResponse(ctx, pick);
      return await mediaReply(ctx, response, {
        descriptionBelow: creditLine(),
        embedFooter: replyCredit.describeEmbedFooter(),
      });
    } catch(error) {
      picked.delete(index);
      const { translateMaybe } = await getTranslator(ctx);
      const apiError = await getApiError(error);
      let description: string;
      if (apiError) {
        const key = getApiErrorTranslationKey(apiError.code);
        description = (key) ? translateMaybe(key, apiError.message) : apiError.message;
      } else {
        description = String((error && error.message) || error);
      }
      return displayReply(ctx, {description: `${StatusEmojis.WARNING} ${description}`}).catch(() => {});
    }
  };

  const row = new ComponentActionRow();
  for (let index = 0; index < GRID_COUNT; index++) {
    row.createButton({
      label: String(index + 1),
      style: MessageComponentButtonStyles.SECONDARY,
      run: (ctx: ComponentContext) => onPick(ctx, index),
    });
  }

  return jobReply(context, job, {
    ...replyCredit,
    actions: {
      rows: [row],
      timeout: PICK_TIMEOUT,
      onTimeout: (strip) => strip().catch(() => {}),
    },
  });
}

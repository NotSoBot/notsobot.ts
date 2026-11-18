import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentActionRow, ComponentContext, Markup } from 'detritus-client/lib/utils';

import { utilitiesMLPixelart } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { MediaReplyActions, jobReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.ml.pixelart';

// the model behind it, credited under every result (their card asks for "Tessera by Jagrat Patel (TheJagStudio)")
const MODEL_CREDIT = 'Tessera by Jagrat Patel (TheJagStudio)';
const MODEL_URL = 'https://huggingface.co/thejagstudio/tessera-small';

export const CREDITS = [{name: 'Jagrat Patel (TheJagStudio)', url: MODEL_URL}];

// what the api takes, it adds up to 3 to it (a sprite per seed)
const SEED_MAX = 2 ** 32;

// sprites in the grid, a button each
const SPRITE_COUNT = 4;
// how long the buttons keep working, an interaction's reply can only be edited for 15 minutes
const PICK_TIMEOUT = 10 * 60 * 1000;

export interface CommandArgs {
  query: string,
  seed?: number,
}

// the api sends the 2x2 grid as one image (discord crops each image of a gallery to fill its cell) and each sprite
// alone after it. The reply shows the grid with a button per sprite, a button shows that sprite in its place with a
// button back to the grid. Only whoever ran it can press them, nothing is made again
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const seed = (args.seed !== undefined) ? args.seed : 1 + Math.floor(Math.random() * (SEED_MAX - 1));
  const job = await utilitiesMLPixelart(context, {query: args.query, safe: true, seed});

  // labelled like the help page's credits
  const { translate } = await getTranslator(context);
  const label = translate('help.credits');
  const descriptionBelow = `-# **${label}**: ${Markup.url(MODEL_CREDIT, `<${MODEL_URL}>`)}`;
  const embedFooter = {text: `${label}: ${MODEL_CREDIT}`};

  let grid: RestResponsesRaw.FileResponse | null = null;
  let sprites: Array<RestResponsesRaw.FileResponse> = [];
  // goes up with each press, a view's buttons only time out (and go) while nothing newer was shown
  let shown = 0;
  let showing = false;

  // `sprite` null is the grid
  const createActions = (sprite: number | null): MediaReplyActions => {
    const shownAt = shown;
    const row = new ComponentActionRow();
    if (sprite === null) {
      for (let i = 0; i < SPRITE_COUNT; i++) {
        row.createButton({
          label: String(i + 1),
          style: MessageComponentButtonStyles.SECONDARY,
          run: (ctx) => onPress(ctx, i),
        });
      }
    } else {
      row.createButton({
        label: translate('pixelart.back_to_grid'),
        style: MessageComponentButtonStyles.SECONDARY,
        run: (ctx) => onPress(ctx, null),
      });
    }
    return {
      rows: [row],
      timeout: PICK_TIMEOUT,
      onTimeout: (strip) => (shown === shownAt) ? strip().catch(() => {}) : undefined,
    };
  };

  const onPress = async (ctx: ComponentContext, sprite: number | null) => {
    const response = (sprite === null) ? grid : sprites[sprite];
    if (ctx.userId !== context.userId || showing || !response) {
      return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE).catch(() => {});
    }
    shown++;
    showing = true;
    try {
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      await mediaReply(context, response, {actions: createActions(sprite), descriptionBelow, embedFooter});
    } catch(error) {

    } finally {
      showing = false;
    }
  };

  return jobReply(context, job, {
    actions: createActions(null),
    describeBelow: () => descriptionBelow,
    describeEmbedFooter: () => embedFooter,
    show: (response) => {
      // the first file is the grid (`response.file`), the rest each sprite. Shown again later they have no "took",
      // it would count from when the command was run
      const files = response.files || [];
      grid = {...response, files: undefined, took: 0};
      sprites = files.slice(1).map((entry) => ({...response, ...entry, files: undefined, took: 0}));
      return {...response, files: undefined};
    },
  });
}

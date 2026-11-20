import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentActionRow, ComponentContext, Markup } from 'detritus-client/lib/utils';

import { utilitiesMLPixelart } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { MediaReplyActions, getMediaReplyActionsTimeout, jobReply, mediaReply } from '../../../utils';
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
// how long the buttons keep working, a slash reply's go sooner (`getMediaReplyActionsTimeout`)
const PICK_TIMEOUT = 10 * 60 * 1000;

export interface CommandArgs {
  query: string,
  seed?: number,
}

// what the reply shows, the grid or one sprite
type PixelartView = {kind: 'grid'} | {kind: 'sprite', index: number};

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
  // the view on the reply, set once a press's edit lands: a view's buttons only time out (and go) while it's still the
  // one shown, and a failed edit leaves the old one (and its buttons) up so they still go
  let shown: PixelartView = {kind: 'grid'};
  // a press is being shown, the others are ignored until it's done
  let swapping = false;
  // the shown view's buttons timed out mid swap, they go if the swap doesn't land (a landed one brings its own)
  let stripAfterSwap: (() => Promise<void>) | null = null;

  const createActions = (view: PixelartView): MediaReplyActions => {
    const row = new ComponentActionRow();
    if (view.kind === 'grid') {
      for (let i = 0; i < SPRITE_COUNT; i++) {
        row.createButton({
          label: String(i + 1),
          style: MessageComponentButtonStyles.SECONDARY,
          run: (ctx) => onPress(ctx, {kind: 'sprite', index: i}),
        });
      }
    } else {
      row.createButton({
        label: translate('pixelart.back_to_grid'),
        style: MessageComponentButtonStyles.SECONDARY,
        run: (ctx) => onPress(ctx, {kind: 'grid'}),
      });
    }
    return {
      rows: [row],
      get timeout() {
        return getMediaReplyActionsTimeout(context, PICK_TIMEOUT);
      },
      onTimeout: (strip) => {
        if (shown !== view) {
          return;
        }
        if (swapping) {
          stripAfterSwap = strip;
          return;
        }
        return strip().catch(() => {});
      },
    };
  };

  const onPress = async (ctx: ComponentContext, view: PixelartView) => {
    const response = (view.kind === 'grid') ? grid : sprites[view.index];
    if (ctx.userId !== context.userId || swapping || !response) {
      return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE).catch(() => {});
    }
    swapping = true;
    let swapped = false;
    try {
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      await mediaReply(context, response, {actions: createActions(view), descriptionBelow, embedFooter});
      swapped = true;
      shown = view;
    } catch(error) {

    } finally {
      swapping = false;
      const strip = stripAfterSwap;
      stripAfterSwap = null;
      if (strip && !swapped) {
        await strip().catch(() => {});
      }
    }
  };

  return jobReply(context, job, {
    actions: createActions(shown),
    describeBelow: () => descriptionBelow,
    describeEmbedFooter: () => embedFooter,
    show: (response) => {
      // the first item is the grid, the rest each sprite. Shown again later they have no "took", it would count from
      // when the command was run
      const [ first, ...rest ] = response.items;
      grid = {...response, items: [first], took: 0};
      sprites = rest.map((item) => ({...response, items: [item], took: 0}));
      // only the grid, several items would be posted as a gallery
      return {...response, items: [first]};
    },
  });
}

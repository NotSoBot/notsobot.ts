import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { utilitiesMLPixelart } from '../../../api';
import { jobReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.ml.pixelart';

// the model behind it, credited under every result (their card asks for "Tessera by Jagrat Patel (TheJagStudio)")
const MODEL_CREDIT = 'Tessera by Jagrat Patel (TheJagStudio)';
const MODEL_URL = 'https://huggingface.co/thejagstudio/tessera-small';

export const CREDITS = [{name: 'Jagrat Patel (TheJagStudio)', url: MODEL_URL}];

// what the api takes, it adds up to 3 to it (a sprite per seed)
const SEED_MAX = 2 ** 32;

export interface CommandArgs {
  query: string,
  seed?: number,
}

// the api sends each sprite as its own file, `jobReply` posts them together
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const seed = (args.seed !== undefined) ? args.seed : 1 + Math.floor(Math.random() * (SEED_MAX - 1));
  const job = await utilitiesMLPixelart(context, {query: args.query, safe: true, seed});

  // labelled like the help page's credits
  const { translate } = await getTranslator(context);
  const label = translate('help.credits');
  return jobReply(context, job, {
    describeBelow: () => `-# **${label}**: ${Markup.url(MODEL_CREDIT, `<${MODEL_URL}>`)}`,
    describeEmbedFooter: () => ({text: `${label}: ${MODEL_CREDIT}`}),
  });
}

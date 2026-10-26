import { Command, Interaction } from 'detritus-client';
import { Markup, rgbToInt } from 'detritus-client/lib/utils';

import { utilitiesMLTone } from '../../../api';
import { DisplayPayload, displayDetail, displayDetails, displayDetailsLine, displayReply } from '../../../utils';
import { TranslationKey, getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.tone';

// the shown input gets cut here, the whole text is still scored (up to the api's 512 tokens)
const MAX_SHOWN_TEXT_LENGTH = 1000;

// the api's labels in the order they're shown, the overall ones first. two lines of details
const LABEL_LINES: Array<Array<[string, TranslationKey]>> = [
  [
    ['toxicity', 'tools_tone.toxicity'],
    ['severe_toxicity', 'tools_tone.severe_toxicity'],
    ['insult', 'tools_tone.insult'],
    ['threat', 'tools_tone.threat'],
  ],
  [
    ['identity_attack', 'tools_tone.identity_attack'],
    ['obscene', 'tools_tone.obscene'],
    ['sexual_explicit', 'tools_tone.sexual_explicit'],
  ],
];

export interface CommandArgs {
  isEphemeral?: boolean,
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const { scores, truncated } = await utilitiesMLTone(context, {text: args.text});

  const payload: DisplayPayload = {};
  payload.footer = 'Detoxify';

  // green to red by the overall toxicity, like the old perspective command
  const toxicity = scores.toxicity || 0;
  const red = Math.round(255 * toxicity);
  const green = Math.round(255 * (1 - toxicity));
  payload.color = rgbToInt(red, green, (green < red) ? 71 : 129);

  let shownText = args.text;
  if (MAX_SHOWN_TEXT_LENGTH < shownText.length) {
    shownText = shownText.slice(0, MAX_SHOWN_TEXT_LENGTH - 1) + '…';
  }
  payload.description = displayDetails([
    Markup.codeblock(shownText),
    ...LABEL_LINES.map((line) => {
      return displayDetailsLine(line.map(([label, key]) => {
        return displayDetail(translate(key), `${Math.round((scores[label] || 0) * 1000) / 10}%`);
      }));
    }),
    (truncated) ? `-# ${translate('tools_tone.truncated')}` : null,
  ]);

  return displayReply(context, {...payload, ephemeral: args.isEphemeral});
}

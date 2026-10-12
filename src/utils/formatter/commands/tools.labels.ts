import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionLabels } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { createUserEmbed, editOrReply, formatPercentageAsBar, toTitleCase } from '../../../utils';


export interface CommandArgs {
  url: string;
}


export const COMMAND_ID = 'labels';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { label_annotations: labelAnnotations } = await googleContentVisionLabels(context, args);

  const embed = createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter(translate('tools_labels.image_labels'), EmbedBrands.GOOGLE_GO);

  {
    const description: Array<string> = [];
    for (let annotation of labelAnnotations) {
      const text = toTitleCase(annotation.description);
      const percentage = (annotation.score * 100).toFixed(1);
      const bar = formatPercentageAsBar(annotation.score * 100, {bars: 10});
      description.push(`[${bar}] ${percentage}% - ${text}`);
    }
    embed.setDescription(Markup.codeblock(description.join('\n'), {language: 'x1'}));
  }

  return editOrReply(context, {embed});
}

import { Command, Interaction } from 'detritus-client';
import { Markup, rgbToInt } from 'detritus-client/lib/utils';

import { googleContentVisionSafeSearch } from '../../../api';
import { getTranslator } from '../../i18n';
import {
  EmbedBrands,
  EmbedColors,
  GoogleContentVisionSafeSearchAttributes,
  GoogleContentVisionSafeSearchAttributeValues,
} from '../../../constants';
import { DefaultParameters, createUserEmbed, editOrReply, toTitleCase } from '../../../utils';


export interface CommandArgs {
  url: string;
}


export const COMMAND_ID = 'safetylabels';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const allowNSFW = !DefaultParameters.safe(context);

  const { safe_search_annotation: safeSearchAnnotation } = await googleContentVisionSafeSearch(context, args);

  const embed = createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter(translate('tools_safety_labels.safe_search_detection'), EmbedBrands.GOOGLE_CONTENT_VISION_SAFETY);

  const safeValues = Object.values(GoogleContentVisionSafeSearchAttributes).map((value) => Markup.codestring(toTitleCase(value))).join(', ');
  embed.setDescription(translate('tools_safety_labels.likeliness_values_are', {safeValues: safeValues}));

  const toxic: Array<number> = [];
  for (let [key, value] of Object.entries(safeSearchAnnotation)) {
    switch (value) {
      case GoogleContentVisionSafeSearchAttributes.UNLIKELY:
      case GoogleContentVisionSafeSearchAttributes.POSSIBLE:
      case GoogleContentVisionSafeSearchAttributes.LIKELY:
      case GoogleContentVisionSafeSearchAttributes.VERY_LIKELY: {
        toxic.push(GoogleContentVisionSafeSearchAttributeValues[value]);
      }; break;
    }
    embed.addField(toTitleCase(key), toTitleCase(value), true);
  }

  if (toxic.length) {
    const average = toxic.reduce((a, b) => a + b, 0) / toxic.length;
    const red = Math.round(255 * average);
    const green = Math.round(255 * (1 - average));
    const blue = (green < red) ? 71 : 129;
    const color = rgbToInt(red, green, blue);
    embed.setColor(color);

    if (allowNSFW) {
      embed.setThumbnail(args.url);
    } else if (average < 0.50) {
      embed.setThumbnail(args.url);
    }

    const percentage = Math.round(average * 100);
    embed.addField(translate('tools_safety_labels.nsfw_percentage'), `${percentage}%`, true);
  } else {
    const color = rgbToInt(0, 255, 129);
    embed.setColor(color);
    embed.setThumbnail(args.url);
  }

  return editOrReply(context, {embed});
}

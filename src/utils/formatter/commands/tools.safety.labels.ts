import { Command, Interaction } from 'detritus-client';
import { Markup, rgbToInt } from 'detritus-client/lib/utils';

import { googleContentVisionSafeSearch } from '../../../api';
import { getTranslator } from '../../i18n';
import {
  EmbedBrands,
  EmbedColors,
  GoogleContentVisionSafeSearchAttributeValues,
  GoogleContentVisionSafeSearchAttributes,
} from '../../../constants';
import { DefaultParameters, DisplayPayload, displayDetail, displayDetails, displayDetailsLine, displayReply, toTitleCase } from '../../../utils';


export interface CommandArgs {
  url: string;
}


export const COMMAND_ID = 'tools.safety.labels';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const allowNSFW = !DefaultParameters.safe(context);

  const { safe_search_annotation: safeSearchAnnotation } = await googleContentVisionSafeSearch(context, args);

  const payload: DisplayPayload = {};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('tools_safety_labels.safe_search_detection');
  payload.footerIconUrl = EmbedBrands.GOOGLE_CONTENT_VISION_SAFETY;

  // the labels on one line, with the scale they're on in small text under it
  const labels: Array<string> = [];
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
    labels.push(displayDetail(toTitleCase(key), toTitleCase(value)));
  }

  if (toxic.length) {
    const average = toxic.reduce((a, b) => a + b, 0) / toxic.length;
    const red = Math.round(255 * average);
    const green = Math.round(255 * (1 - average));
    const blue = (green < red) ? 71 : 129;
    const color = rgbToInt(red, green, blue);
    payload.color = color;

    if (allowNSFW) {
      payload.thumbnail = args.url;
    } else if (average < 0.50) {
      payload.thumbnail = args.url;
    }

    const percentage = Math.round(average * 100);
    labels.push(displayDetail(translate('tools_safety_labels.nsfw_percentage'), `${percentage}%`));
  } else {
    const color = rgbToInt(0, 255, 129);
    payload.color = color;
    payload.thumbnail = args.url;
  }

  const safeValues = Object.values(GoogleContentVisionSafeSearchAttributes).map((value) => Markup.codestring(toTitleCase(value))).join(', ');
  payload.description = displayDetails([
    displayDetailsLine(labels),
    `-# ${translate('tools_safety_labels.likeliness_values_are', {safeValues: safeValues})}`,
  ]);

  return displayReply(context, payload);
}

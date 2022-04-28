import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup, rgbToInt } from 'detritus-client/lib/utils';

import { googleContentVisionSafeSearch } from '../../../api';
import {
  CommandCategories,
  EmbedBrands,
  EmbedColors,
  GoogleContentVisionSafeSearchAttributes,
  GoogleContentVisionSafeSearchAttributeValues,
} from '../../../constants';
import { createUserEmbed, editOrReply, toTitleCase } from '../../../utils';

import { BaseImageCommand } from '../basecommand';

export interface CommandArgs {
  url: string;
}

export const COMMAND_NAME = 'safetylabels';

export default class SafetyLabelsCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['slabels', 'safelabels', 'isnsfw'],
      metadata: {
        description: 'Get the safety labels of an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        permissionsClient: [Permissions.EMBED_LINKS],
        category: CommandCategories.TOOLS,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { safe_search_annotation: safeSearchAnnotation } = await googleContentVisionSafeSearch(context, args);

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter('Safe Search Detection', EmbedBrands.GOOGLE_CONTENT_VISION_SAFETY);
    embed.setThumbnail(args.url);

    const safeValues = Object.values(GoogleContentVisionSafeSearchAttributes).map((value) => Markup.codestring(toTitleCase(value))).join(', ');
    embed.setDescription(`Likeliness values are ${safeValues}`);

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
    } else {
      const color = rgbToInt(0, 255, 129);
      embed.setColor(color);
    }

    return editOrReply(context, {embed});
  }
}

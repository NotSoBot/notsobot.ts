import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionLabels } from '../../../api';
import { CommandCategories, EmbedBrands, EmbedColors } from '../../../constants';
import { createUserEmbed, formatPercentageAsBar, toTitleCase } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgs {
  url: string;
}

export const COMMAND_NAME = 'labels';

export default class LabelsCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Get the labels of an image',
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
    const { label_annotations: labelAnnotations } = await googleContentVisionLabels(context, args);

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter('Image Labels', EmbedBrands.GOOGLE_GO);
    embed.setThumbnail(args.url);

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

    return context.editOrReply({embed});
  }
}

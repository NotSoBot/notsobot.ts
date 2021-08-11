import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { imageInformationExif } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../../constants';
import { createUserEmbed, editOrReply, formatMemory, splitArray } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'exif';

export default class ExifCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Get exif information from an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageInformationExif(context, args);
    const isGif = (response.information.mimetype === 'image/gif');

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter('Image Exif Information', EmbedBrands.NOTSOBOT);

    {
      const { information, metadata } = response;

      const description: Array<string> = [];
      description.push(`**Color Profile**: ${information.interpretation}`);
      description.push(`**Dimensions**: ${information.width}x${information.height}`);
      if (isGif) {
        description.push(`**Frames**: ${information.frames.toLocaleString()}`);
        description.push(`**Frame Delay**: ${information.delay.toLocaleString()}`);
        description.push(`**Loops**: ${(information.loop) ? 'Yes' : 'No'}`);
      }
      description.push(`**Mimetype**: ${information.mimetype}`);
      description.push(`**Size**: ${formatMemory(information.size)}`);

      if (metadata['gif-comment']) {
        description.push('');
        description.push(`**Comment**`);
        description.push(Markup.codeblock(metadata['gif-comment']))
      }

      embed.setDescription(description.join('\n'));
    }

    if (response.exif.length) {
      const exif = response.exif.map((field) => {
        field.name = field.name.split('-').pop() as string;
        return field;
      }).sort((x, y) => x.name.localeCompare(y.name));

      const split = splitArray<any>(exif, 3);
      for (let i = 0; i < split.length; i++) {
        const fields = split[i];
        const description: Array<string> = [];

        for (let field of fields) {
          let value: string;
          if (field.description === field.value) {
            value = field.value;
          } else {
            value = `${field.value} (${field.description})`;
          }
          if (value) {
            description.push(`**${field.name.split('-').pop()}**`);
            description.push(`-> ${value}`);
          }
        }

        const title = (!i) ? 'Exif Data' : '\u200b';
        embed.addField(title, description.join('\n') || '\u200b', true);
      }
      if (response.url) {
        embed.setImage(response.url);
      }
    } else {
      if (response.url) {
        embed.setThumbnail(response.url);
      }
    }

    return editOrReply(context, {embed});
  }
}

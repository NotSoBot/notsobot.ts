import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { mediaAIVToolsExif } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { createUserEmbed, editOrReply, formatMemory, splitArray } from '../../../utils';


export const COMMAND_ID = 'tools.exif';

export interface CommandArgs {
 url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const response = await mediaAIVToolsExif(context, args);
  const isGif = (response.information.mimetype === 'image/gif');

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
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

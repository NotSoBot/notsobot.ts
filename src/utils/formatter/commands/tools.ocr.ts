import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { googleContentVisionOCR } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
} from '../../../constants';
import { createUserEmbed, editOrReply, languageCodeToText } from '../../../utils';


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: {isEphemeral?: boolean, noembed?: boolean, upload?: boolean, url: string},
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { annotation } = await googleContentVisionOCR(context, {url: args.url});

  let description: string = '';
  if (annotation) {
    if (2000 < annotation.description.length && args.upload) {
      try {
        const upload = await context.rest.request({
          files: [{filename: 'ocr.txt', key: 'file', value: annotation.description}],
          method: 'post',
          url: 'https://api.files.gg/files',
        });
        description = upload.urls.main;
      } catch(error) {
        description = Markup.codeblock(annotation.description);
      }
    } else {
      description = Markup.codeblock(annotation.description);
    }
  }

  if (args.noembed) {
    if (!annotation) {
      return editOrReply(context, {
        content: '⚠ No text detected',
        flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
      });
    }

    const title = `${languageCodeToText(annotation.locale)} Text`;
    return editOrReply(context, {
      content: [title, description].join('\n'),
      flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
    });
  } else {
    const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter('Optical Character Recognition', EmbedBrands.GOOGLE_GO);
    embed.setThumbnail(args.url);

    if (annotation) {
      const language = languageCodeToText(annotation.locale);
      embed.setTitle(`${language} Text`);
      embed.setDescription(description);
    } else {
      embed.setColor(EmbedColors.ERROR);
      embed.setDescription('No text detected');
    }

    return editOrReply(context, {
      embed,
      flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
    });
  }
}

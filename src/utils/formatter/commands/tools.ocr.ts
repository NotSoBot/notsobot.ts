import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { googleContentVisionOCR } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
  StatusEmojis,
} from '../../../constants';
import { createUserEmbed, editOrReply, languageCodeToText } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.ocr';

export interface CommandArgs {
  isEphemeral?: boolean,
  noembed?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const { language, languageName, translate } = await getTranslator(context);

  const { annotation } = await googleContentVisionOCR(context, {url: args.url});

  let description: string = '';
  let file: {filename: string, value: string} | undefined;
  if (annotation) {
    if (2000 < annotation.description.length) {
      file = {filename: 'ocr.txt', value: annotation.description};
      description = translate('tools.ocr.characters', {count: annotation.description.length.toLocaleString(language)});
      /*
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
      */
    } else {
      description = Markup.codeblock(annotation.description);
    }
  }

  if (args.noembed) {
    if (!annotation) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('tools.ocr.no_text')}`,
        flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
      });
    }

    const title = translate('tools.ocr.title', {language: languageName(annotation.locale, languageCodeToText(annotation.locale))});
    return editOrReply(context, {
      content: [title, description].join('\n'),
      flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
    });
  } else {
    const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter(translate('tools.ocr.footer'), EmbedBrands.GOOGLE_GO);
    embed.setThumbnail(args.url);

    if (annotation) {
      embed.setTitle(translate('tools.ocr.title', {language: languageName(annotation.locale, languageCodeToText(annotation.locale))}));
      embed.setDescription(description);
    } else {
      embed.setColor(EmbedColors.ERROR);
      embed.setDescription(translate('tools.ocr.no_text'));
    }

    return editOrReply(context, {
      embed,
      file,
      flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
    });
  }
}

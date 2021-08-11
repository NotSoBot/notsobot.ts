import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionOCR, googleTranslate } from '../../../api';
import { CommandTypes, EmbedBrands, EmbedColors, GoogleLocales } from '../../../constants';
import { Arguments, Parameters, createUserEmbed, editOrReply, languageCodeToText } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  to: null | GoogleLocales,
  url?: null | string,
}

export interface CommandArgs {
  to: null | GoogleLocales,
  url: string,
}

export const COMMAND_NAME = 'ocrtranslate';

export default class OCRTranslateCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ocrtr', 'trocr', 'translateocr'],
      args: [
        {name: 'to', default: Arguments.GoogleLocale.default, type: Arguments.GoogleLocale.type},
      ],
      metadata: {
        description: 'Read text inside of an image and translate it',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png`,
          `${COMMAND_NAME} https://google.com -to russian`,
        ],
        type: CommandTypes.TOOLS,
        usage: '?<emoji,user:id|mention|name,url> (-to <language>)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { annotation } = await googleContentVisionOCR(context, {url: args.url});

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter('Google Translate from OCR', EmbedBrands.GOOGLE_GO);
    embed.setThumbnail(args.url);

    if (annotation) {
      let locale: GoogleLocales | undefined;
      if (annotation.locale in GoogleLocales) {
        locale = annotation.locale;
      }

      const {
        from_language: fromLanguage,
        translated_language: translatedLanguage,
        translated_text: translatedText,
      } = await googleTranslate(context, {
        from: locale,
        text: annotation.description,
        to: args.to || undefined,
      });

      const fromLanguageText = languageCodeToText(fromLanguage);
      const translatedLanguageText = languageCodeToText(translatedLanguage);
      embed.setTitle(`Translated from ${fromLanguageText} to ${translatedLanguageText}`);
      embed.setDescription(Markup.codeblock(translatedText));
    } else {
      embed.setColor(EmbedColors.ERROR);
      embed.setDescription('No text detected');
    }

    return editOrReply(context, {embed});
  }
}

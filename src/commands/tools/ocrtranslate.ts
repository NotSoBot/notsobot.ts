import { Command, CommandClient, Utils } from 'detritus-client';
const { Embed, Markup } = Utils;

import { googleContentVisionOCR, googleTranslate } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors, GoogleLocales } from '../../constants';
import { Arguments, Parameters, languageCodeToText } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  to: null | GoogleLocales,
  url?: null | string,
}

export interface CommandArgs {
  to: null | GoogleLocales,
  url: string,
}

export default class OCRTranslateCommand extends BaseImageCommand<CommandArgs> {
  name = 'ocrtranslate';

  aliases = ['ocrtr', 'trocr', 'translateocr'];
  label = 'url';
  metadata = {
    description: 'Read text inside of an image and translate it',
    examples: [
      'ocrtranslate',
      'ocrtranslate cake',
      'ocrtranslate https://cdn.notsobot.com/brands/notsobot.png',
    ],
    type: CommandTypes.TOOLS,
    usage: 'ocrtranslate ?<emoji|id|mention|name|url> (-to <language>)',
  };
  type = Parameters.lastImageUrl;

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [{name: 'to', default: Arguments.GoogleLocale.default, type: Arguments.GoogleLocale.type}],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const { annotation } = await googleContentVisionOCR(context, {url: args.url});
    const embed = new Utils.Embed();
    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
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

    return context.editOrReply({embed});
  }
}

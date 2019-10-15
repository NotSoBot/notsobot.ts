import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { googleContentVisionOCR, googleTranslate } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors, GoogleLocales, GoogleLocalesText } from '../../constants';
import { Arguments, Parameters, onRunError, onTypeError } from '../../utils';


export interface CommandArgs {
  to: null | string,
  url: string,
}

export default (<Command.CommandOptions> {
  name: 'ocrtranslate',
  aliases: ['ocrtr', 'trocr', 'translateocr'],
  args: [
    {name: 'to', default: null, type: Arguments.GoogleLocale.type},
  ],
  label: 'url',
  metadata: {
    description: 'Read text inside of an image and translate it',
    examples: [
      'ocrtranslate',
      'ocrtranslate cake',
      'ocrtranslate https://cdn.notsobot.com/brands/notsobot.png',
    ],
    type: CommandTypes.TOOLS,
    usage: 'ocrtranslate ?<emoji|id|mention|name|url> (-to <language>)',
  },
  ratelimits: [
    {
      duration: 5000,
      limit: 5,
      type: 'guild',
    },
    {
      duration: 1000,
      limit: 1,
      type: 'channel',
    },
  ],
  type: Parameters.lastImageUrl,
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canAttachFiles : false;
  },
  onCancel: (context) => context.reply('⚠ Unable to send files in this channel.'),
  onBeforeRun: (context, args) => !!args.url,
  onCancelRun: (context, args) => {
    if (args.url === undefined) {
      return context.editOrReply('⚠ Unable to find any messages with an image.');
    } else {
      return context.editOrReply('⚠ Unable to find that user or it was an invalid url.');
    }
  },
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

    const { annotation } = await googleContentVisionOCR(context, {url: args.url});
    const embed = new Utils.Embed();
    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter('Google Translate from OCR', EmbedBrands.GOOGLE_GO);

    if (annotation) {
      let locale: string | undefined;
      if (annotation.locale in GoogleLocales) {
        locale = annotation.locale;
      }

      const {
        from_text: fromText,
        from_language: fromLanguage,
        translated_language: translatedLanguage,
        translated_text: translatedText,
      } = await googleTranslate(context, {
        from: locale,
        text: annotation.description,
        to: args.to || undefined,
      });

      let fromLanguageText: string = fromLanguage;
      if (fromLanguage in GoogleLocalesText) {
        fromLanguageText = GoogleLocalesText[fromLanguage];
      }
      let translatedLanguageText: string = translatedLanguage;
      if (translatedLanguage in GoogleLocalesText) {
        translatedLanguageText = GoogleLocalesText[translatedLanguageText];
      }
      embed.setTitle(`Translated from ${fromLanguageText} to ${translatedLanguageText}`);
      embed.setDescription(Markup.codeblock(translatedText));
    } else {
      embed.setColor(EmbedColors.ERROR);
      embed.setTitle('⚠ Command Error');
      embed.setDescription('No text detected');
    }

    return context.editOrReply({embed});
  },
  onRunError,
  onTypeError,
});

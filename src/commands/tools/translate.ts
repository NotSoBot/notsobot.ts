import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { googleTranslate } from '../../api';
import {
  CommandTypes,
  EmbedBrands,
  EmbedColors,
  GoogleLocalesText,
} from '../../constants';
import { Arguments, onRunError, onTypeError } from '../../utils';


export interface CommandArgs {
  from: null | string,
  text: string,
  to: null | string,
}

export default (<Command.CommandOptions> {
  name: 'translate',
  aliases: ['tr'],
  args: [
    {name: 'from', default: null, type: Arguments.GoogleLocale.type},
    {name: 'to', default: null, type: Arguments.GoogleLocale.type},
  ],
  label: 'text',
  metadata: {
    description: 'Translate some text',
    examples: [
      'translate не так бот',
      'translate not so bot -to russian',
    ],
    type: CommandTypes.TOOLS,
    usage: 'google <text> (-to <language>) (-from <language>)',
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
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.editOrReply('⚠ Unable to embed in this channel.'),
  onBeforeRun: (context, args) => !!args.text,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of text.'),
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();
    const {
      from_text: fromText,
      from_language: fromLanguage,
      translated_language: translatedLanguage,
      translated_text: translatedText,
    } = await googleTranslate(context, {
      from: args.from || undefined,
      text: args.text,
      to: args.to || undefined,
    });

    const embed = new Utils.Embed();
    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter('Google Translate', EmbedBrands.GOOGLE_GO);

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

    return context.editOrReply({embed});
  },
  onRunError,
  onTypeError,
});

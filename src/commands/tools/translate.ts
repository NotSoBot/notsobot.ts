import { Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { googleTranslate } from '../../api';
import {
  CommandTypes,
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
} from '../../constants';
import { Arguments, createUserEmbed } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  from: GoogleLocales | null,
  text: string,
  to: GoogleLocales | null,
}

export interface CommandArgs {
  from: GoogleLocales | null,
  text: string,
  to: GoogleLocales | null,
}

export default class TranslateCommand extends BaseCommand {
  aliases = ['tr'];
  name = 'translate';

  args = [
    {name: 'from', default: null, type: Arguments.GoogleLocale.type},
    {name: 'to', default: Arguments.GoogleLocale.default, type: Arguments.GoogleLocale.type},
  ];
  label = 'text';
  metadata = {
    description: 'Translate some text',
    examples: [
      'translate не так бот',
      'translate not so bot -to russian',
    ],
    type: CommandTypes.TOOLS,
    usage: 'google <text> (-to <language>) (-from <language>)',
  };
  permissionsClient = [Permissions.EMBED_LINKS];

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Provide some kind of text.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const {
      from_language: fromLanguage,
      translated_language: translatedLanguage,
      translated_text: translatedText,
    } = await googleTranslate(context, {
      from: args.from || undefined,
      text: args.text,
      to: args.to || undefined,
    });

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter('Google Translate', EmbedBrands.GOOGLE_GO);

    let fromLanguageText: string = fromLanguage;
    if (fromLanguage in GoogleLocalesText) {
      fromLanguageText = GoogleLocalesText[fromLanguage];
    }
    let translatedLanguageText: string = translatedLanguage;
    if (translatedLanguage in GoogleLocalesText) {
      translatedLanguageText = GoogleLocalesText[translatedLanguage];
    }
    embed.setTitle(`Translated from ${fromLanguageText} to ${translatedLanguageText}`);
    embed.setDescription(Markup.codeblock(translatedText));

    return context.editOrReply({embed});
  }
}

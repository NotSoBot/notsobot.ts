import { Slash } from 'detritus-client';
import { ApplicationCommandOptionTypes, InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { googleTranslate } from '../../api';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
} from '../../constants';
import { Parameters, createUserEmbed } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  from: GoogleLocales | null,
  text: string,
  to: GoogleLocales | null,
}

export const COMMAND_NAME = 'translate';

export default class TranslateCommand extends BaseCommand {
  description = 'Translate some text';
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'text', type: ApplicationCommandOptionTypes.STRING, description: 'Text to translate', required: true},
        {name: 'to', type: ApplicationCommandOptionTypes.STRING, description: 'Language to translate to', choices: Parameters.Slash.GOOGLE_LOCALES},
        {name: 'from', type: ApplicationCommandOptionTypes.STRING, description: 'Language to translate from', choices: Parameters.Slash.GOOGLE_LOCALES},
      ],
    })
  }

  async run(context: Slash.SlashContext, args: CommandArgs) {
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

    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {embed});
  }
}

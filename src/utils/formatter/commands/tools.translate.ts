import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { googleTranslate } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
} from '../../../constants';
import { createUserEmbed, editOrReply, splitTextByAmount } from '../../../utils';


export const COMMAND_ID = 'tools.translate';

export interface CommandArgs {
  from?: GoogleLocales | null,
  isEphemeral?: boolean,
  text: string,
  to?: GoogleLocales | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const {
    from_language: fromLanguage,
    translated_language: translatedLanguage,
    translated_text: translatedText,
  } = await googleTranslate(context, {
    from: args.from || undefined,
    text: args.text,
    to: args.to || undefined,
  });

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
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

  const shouldShowInput = (isFromInteraction && translatedText !== args.text);
  if (shouldShowInput) {
    // 1024 - 10 ('```\n\n```')
    const parts = splitTextByAmount(args.text, 1014, '');
    embed.addField(fromLanguageText, Markup.codeblock(parts.shift() as string));
    for (let part of parts) {
      embed.addField('\u200b', Markup.codeblock(part));
    }
  }

  {
    // 1024 - 10 ('```\n\n```')
    const parts = splitTextByAmount(translatedText, 1014, '');
    const title = (fromLanguage === translatedLanguage || shouldShowInput) ? translatedLanguageText : `${fromLanguageText} -> ${translatedLanguageText}`;
    embed.addField(title, Markup.codeblock(parts.shift() as string));
    for (let part of parts) {
      embed.addField('\u200b', Markup.codeblock(part));
    }
  }

  return editOrReply(context, {
    embed,
    flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
  });
}

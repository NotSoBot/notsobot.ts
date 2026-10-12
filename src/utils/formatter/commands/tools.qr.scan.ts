import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { utilitiesQrScan } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
} from '../../../constants';
import { createUserEmbed, editOrReply, toTitleCase } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.qr.scan';

export interface CommandArgs {
 isEphemeral?: boolean,
 url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const { language, translate } = await getTranslator(context);

  const { results, url } = await utilitiesQrScan(context, args);

  let footer = translate('tools.qr.footer');
  if (25 < results.length) {
    footer = translate('tools.qr.footer_results', {count: results.length.toLocaleString(language)});
  }

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter(footer, EmbedBrands.NOTSOBOT);
  embed.setThumbnail(url || args.url);

  embed.setTitle(translate((results.length === 1) ? 'tools.qr.title' : 'tools.qr.title_plural'));
  if (results.length) {
    const sorted: Record<string, Array<{data: string, type: string}>> = {};
    for (let result of results.slice(0, 25)) {
      const scans = sorted[result.type] = (sorted[result.type] || []);
      scans.push(result);
    }

    for (let type in sorted) {
      for (let i = 0; i < sorted[type].length; i++) {
        const qr = sorted[type][i];

        let title = translate('tools.qr.scan', {type: toTitleCase(qr.type)});
        if (1 < sorted[type].length) {
          title = `${title} ${i + 1}`;
        }

        embed.addField(title, Markup.codeblock(qr.data, {limit: 1014}));
      }
    }
  } else {
    embed.setDescription(translate('tools.qr.none'));
  }
  return editOrReply(context, {
    embed,
    flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
  });
}

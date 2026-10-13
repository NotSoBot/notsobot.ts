import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { utilitiesQrScan } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
} from '../../../constants';
import { DisplayPayload, displayReply, toTitleCase } from '../../../utils';
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
  const { language, translate } = await getTranslator(context);

  const { results, url } = await utilitiesQrScan(context, args);

  let footer = translate('tools.qr.footer');
  if (25 < results.length) {
    footer = translate('tools.qr.footer_results', {count: results.length.toLocaleString(language)});
  }

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = footer;
  payload.footerIconUrl = EmbedBrands.NOTSOBOT;
  payload.thumbnail = url || args.url;

  payload.title = translate((results.length === 1) ? 'tools.qr.title' : 'tools.qr.title_plural');
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

        payload.fields!.push({name: title, value: Markup.codeblock(qr.data, {limit: 1014})});
      }
    }
  } else {
    payload.description = translate('tools.qr.none');
  }
  return displayReply(context, {...payload, ephemeral: args.isEphemeral});
}

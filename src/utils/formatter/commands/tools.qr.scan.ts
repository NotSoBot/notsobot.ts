import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { utilitiesQrScan } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
} from '../../../constants';
import { createUserEmbed, editOrReply } from '../..';


export const COMMAND_ID = 'qr scan';

export interface CommandArgs {
 isEphemeral?: boolean,
 url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { scanned, url } = await utilitiesQrScan(context, args);

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter('QR Scanner', EmbedBrands.NOTSOBOT);
  embed.setThumbnail(url || args.url);

  embed.setTitle('QR Code Scan Result');
  if (scanned.length) {
    for (let i = 0; i < scanned.length; i++) {
      const qr = scanned[i];
      embed.addField(`QR Code ${i + 1}`, Markup.codeblock(qr.data, {limit: 1014}));
    }
  } else {
    embed.setDescription('No QR Codes found');
  }
  return editOrReply(context, {
    embed,
    flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
  });
}

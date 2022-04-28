import * as Crypto from 'crypto';

import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import {
  EmbedBrands,
  EmbedColors,
} from '../../../constants';
import { createUserEmbed, editOrReply, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'tools.hash';

export enum HashTypes {
  MD4 = 'MD4',
  MD5 = 'MD5',
  SHA = 'SHA',
  SHA1 = 'SHA1',
  SHA224 = 'SHA224',
  SHA256 = 'SHA256',
  SHA384 = 'SHA384',
  SHA512 = 'SHA512',
  WHIRLPOOL = 'WHIRLPOOL',
}


export interface CommandArgs {
  secret?: string,
  text: string;
  use?: HashTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const algorithm = (args.use || HashTypes.MD5).toLowerCase();
  const title = toTitleCase(algorithm);

  let digest: string;
  if (args.secret) {
    const hmac = Crypto.createHmac(algorithm, args.secret);
    hmac.update(args.text);
    digest = hmac.digest('hex');
  } else {
    const hash = Crypto.createHash(algorithm);
    hash.update(args.text);
    digest = hash.digest('hex');
  }

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter((args.secret) ? `${title} HMAC` : `${title} Hash`, EmbedBrands.NOTSOBOT);

  embed.setDescription(Markup.codeblock(args.text));
  if (args.secret) {
    embed.addField('Secret Key', Markup.codeblock(args.secret));
  }
  embed.addField('Result', Markup.codeblock(digest));

  return editOrReply(context, {embed});
}

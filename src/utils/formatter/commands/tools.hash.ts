import * as Crypto from 'crypto';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import {
  EmbedBrands,
  EmbedColors,
} from '../../../constants';
import { getTranslator } from '../../i18n';
import { DisplayPayload, displayReply, toTitleCase } from '../../../utils';


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
  const { language, translate, translateMaybe } = await getTranslator(context);

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

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = (args.secret) ? translate('tools_hash.hmac', {title: title}) : `${title} Hash`;
  payload.footerIconUrl = EmbedBrands.NOTSOBOT;

  payload.description = Markup.codeblock(args.text);
  if (args.secret) {
    payload.fields!.push({name: translate('tools_hash.secret_key'), value: Markup.codeblock(args.secret)});
  }
  payload.fields!.push({name: translate('tools_hash.result'), value: Markup.codeblock(digest)});

  return displayReply(context, payload);
}

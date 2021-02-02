import * as Crypto from 'crypto';

import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { createUserEmbed, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


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
  secret: string,
  text: string;
  use: HashTypes,
}


export const COMMAND_NAME = 'hash';

export default class HashCommand extends BaseCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'secret'},
        {
          name: 'use',
          choices: Object.values(HashTypes),
          default: HashTypes.MD5,
          help: `Must be one of (${Object.values(HashTypes).join(', ')})`,
          type: (value: string) => value.toUpperCase(),
        },
      ],
      label: 'text',
      metadata: {
        description: 'Hash some text, uses MD5 by default',
        examples: [
          `${COMMAND_NAME} Discord Bots`,
          `${COMMAND_NAME} Discord Bots -use sha256`,
        ],
        type: CommandTypes.TOOLS,
        usage: `${COMMAND_NAME} <text> (-use <HashTypes>) (-secret <string>)`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  run(context: Command.Context, args: CommandArgs) {
    const algorithm = args.use.toLowerCase();

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

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter((args.secret) ? `HMAC using ${args.use}` : `Hash using ${args.use}`, EmbedBrands.NOTSOBOT);

    embed.setDescription(Markup.codeblock(args.text));
    if (args.secret) {
      embed.addField('Secret Key', Markup.codeblock(args.secret));
    }
    embed.addField('Result', Markup.codeblock(digest));

    return editOrReply(context, {embed});
  }
}

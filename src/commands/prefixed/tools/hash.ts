import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


const HashTypes = Formatter.Commands.ToolsHash.HashTypes;

export interface CommandArgs {
  secret: string,
  text: string;
  use: Formatter.Commands.ToolsHash.HashTypes,
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
        usage: '<text> (-use <HashTypes>) (-secret <string>)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ToolsHash.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, GoogleLocales } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../utils';

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

export const COMMAND_NAME = 'translate';

export default class TranslateCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tr'],
      args: [
        {name: 'from', default: null, type: Parameters.locale},
        {name: 'to', default: DefaultParameters.locale, type: Parameters.locale},
      ],
      label: 'text',
      metadata: {
        description: 'Translate text to a different language',
        examples: [
          `${COMMAND_NAME} не так бот`,
          `${COMMAND_NAME} not so bot -to russian`,
        ],
        type: CommandTypes.TOOLS,
        usage: '<text> (-to <language>) (-from <language>)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return editOrReply(context, '⚠ Provide some kind of text.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ToolsTranslate.createMessage(context, args);
  }
}

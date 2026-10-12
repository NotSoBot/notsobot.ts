import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'playing';

export default class PlayingCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['membersplaying'],
      disableDm: true,
      label: 'text',
      metadata: {
        description: 'List users in the current server that is playing a certain game.',
        examples: [
          `${COMMAND_NAME} rust`,
          `${COMMAND_NAME} spotify`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoPlaying.COMMAND_ID,
        usage: '?<application:id|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.stringLowerCase(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoPlaying.CommandArgsBefore) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoPlaying.CommandArgs) {
    return Formatter.Commands.InfoPlaying.createMessage(context, args);
  }
}

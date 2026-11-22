import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {

}

export interface CommandArgs {

}

export const COMMAND_NAME = 'nick mass cancel';

export default class NickMassCancelCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'text',
      metadata: {
        description: 'Cancel an ongoing mass nickname change',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MODERATION,
        id: 'moderation.nick.mass.cancel',
        usage: '',
      },
      permissionsClient: [Permissions.CHANGE_NICKNAMES],
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
      priority: -1,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guild = context.guild as Structures.Guild;

    // stops the run itself like its Stop button, clearing only the server's flag left it renaming while a new one could start
    if (Formatter.Commands.ModerationNickMass.stopNickMassRun(guild.id)) {
      return displayReply(context, {description: 'Canceled mass nickname changes'});
    } else {
      return displayReply(context, {description: 'Mass nickname isn\'t ongoing right now'});
    }
  }
}

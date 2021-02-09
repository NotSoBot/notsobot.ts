import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'invite';

export default class InviteCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Invite to Guild Link',
        type: CommandTypes.UTILS,
        usage: `${COMMAND_NAME}`,
      },
    });
  }

  run(context: Command.Context) {
    return editOrReply(context, '<https://beta.notsobot.com/invite>');
  }
}

import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { RestResponsesRaw } from '../../../api/types';
import { CommandTypes } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  tag: false | null | RestResponsesRaw.Tag,
}

export const COMMAND_NAME = 'tag raw';

export default class TagCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t raw', 'tag owner', 't owner'],
      label: 'tag',
      metadata: {
        description: 'View a tag\'s raw content',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} some tag`,
        ],
        type: CommandTypes.FUN,
        usage: '<tagname>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.NotSoTag,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.tag === false) {
      return editOrReply(context, '⚠ Unknown Tag');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagInfo.CommandArgs) {
    return Formatter.Commands.TagInfo.createMessage(context, args);
  }
}

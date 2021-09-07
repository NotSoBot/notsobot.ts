import { Command, CommandClient } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { CommandTypes } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  arguments: Array<string>,
  tag: false | null | RestResponsesRaw.Tag,
}

export const COMMAND_NAME = 'tag';

export default class TagCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t', 'tag show', 't show'],
      metadata: {
        description: 'Show a tag',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} "some tag"`,
          `${COMMAND_NAME} "some tag" arg1`,
        ],
        type: CommandTypes.FUN,
        usage: '<tagname> <...arguments>',
      },
      priority: -1,
      type: [
        {name: 'tag', default: null, type: Parameters.NotSoTag},
        {name: 'arguments', consume: true, type: Parameters.stringArguments},
      ],
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

  async run(context: Command.Context, args: Formatter.Commands.TagShow.CommandArgs) {
    return Formatter.Commands.TagShow.createMessage(context, args);
  }
}

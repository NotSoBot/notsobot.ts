import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'voice record';

export default class VoiceRecordCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['v record'],
      args: [
        {name: 'target', default: DefaultParameters.author, type: Parameters.memberOrUser()},
      ],
      label: 'seconds',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Record your own voice in a voice channel to a WAV file.',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.VoiceRecord.COMMAND_ID,
        usage: '<duration,number>',
      },
      type: Parameters.secondsWithOptions(),
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.VoiceRecord.CommandArgs) {
    return (args.seconds !== undefined) ? (args.seconds <= 60) : false;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.VoiceRecord.CommandArgs) {
    if (args.seconds !== undefined) {
      return editOrReply(context, `Duration must be under or be 60 seconds`);
    }
    return super.onCancelRun && super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceRecord.CommandArgs) {
    return Formatter.Commands.VoiceRecord.createMessage(context, args);
  }
}

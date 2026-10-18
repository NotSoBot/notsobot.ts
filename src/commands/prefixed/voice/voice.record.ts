import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'voice record';

export default class VoiceRecordCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'target', default: DefaultParameters.author, type: Parameters.memberOrUser()},
      ],
      label: 'seconds',
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Record your own voice in a voice channel to a WAV file.',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.VoiceRecord.COMMAND_ID,
        usage: '<duration:number> (-target <user:id|mention|name>)',
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

  async onCancelRun(context: Command.Context, args: Formatter.Commands.VoiceRecord.CommandArgs) {
    if (args.seconds !== undefined) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: translate('voice.record.max_duration')});
    }
    return super.onCancelRun && super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceRecord.CommandArgs) {
    return Formatter.Commands.VoiceRecord.createMessage(context, args);
  }
}

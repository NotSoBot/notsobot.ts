import { Interaction } from 'detritus-client';

import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  content?: string,
  when: Parameters.NLPTimestampResult,
}

export class ReminderCreateCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Create a reminder';
  metadata = {
    id: Formatter.Commands.ReminderCreate.COMMAND_ID,
  };
  name = 'create';

  constructor() {
    super({
      options: [
        {
          name: 'when',
          description: 'When the Reminder should go off',
          required: true,
          value: Parameters.nlpTimestamp,
        },
        {
          name: 'content',
          description: 'Content of the Reminder',
          value: Parameters.string({maxLength: 512}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ReminderCreate.createMessage(context, {
      result: {
        content: args.content || args.when.content,
        contentTimestamp: args.when.contentTimestamp,
        end: args.when.end,
        start: args.when.start,
      },
    });
  }
}

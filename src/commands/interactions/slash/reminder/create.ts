import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  content?: string,
  when: Parameters.NLPTimestampResult,
}

export class ReminderCreateCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Create a reminder';
  descriptionLocalizations = I18n.localizations('commands.reminder.create.description');
  metadata = {
    id: Formatter.Commands.ReminderCreate.COMMAND_ID,
  };
  name = 'create';
  nameLocalizations = I18n.localizations('commands.reminder.create.name');

  constructor() {
    super({
      options: [
        {
          name: 'when',
          description: 'When the Reminder should go off',
          ...I18n.optionLocalizations('commands.reminder.create.when'),
          required: true,
          value: Parameters.nlpTimestamp,
        },
        {
          name: 'content',
          description: 'Content of the Reminder',
          ...I18n.optionLocalizations('commands.reminder.create.content'),
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

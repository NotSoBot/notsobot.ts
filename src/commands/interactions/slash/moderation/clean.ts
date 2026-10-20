import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { COMMAND_ID, MAX_AMOUNT, createCleanMessage } from '../../../prefixed/moderation/clean';
import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  amount: number,
}

export const COMMAND_NAME = 'clean';

export class ModerationCleanCommand extends BaseInteractionCommandOption {
  description = 'Delete my recent messages and the messages that used my commands';
  descriptionLocalizations = I18n.localizations('commands.moderation.clean.description');
  metadata = {
    id: COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.clean.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_MESSAGES],
      options: [
        {
          name: 'amount',
          description: `Amount of messages to delete (1..${MAX_AMOUNT})`,
          ...I18n.optionLocalizations('commands.moderation.clean.amount'),
          maxValue: MAX_AMOUNT,
          minValue: 1,
          required: true,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return createCleanMessage(context, args);
  }
}

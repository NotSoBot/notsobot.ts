import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { COMMAND_ID, DEFAULT_AMOUNT, MAX_AMOUNT, createCleanMessage } from '../../../prefixed/moderation/clean';
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
          description: `Amount of messages to delete (1..${MAX_AMOUNT}) (Default: ${DEFAULT_AMOUNT})`,
          ...I18n.optionLocalizations('commands.moderation.clean.amount'),
          default: DEFAULT_AMOUNT,
          maxValue: MAX_AMOUNT,
          minValue: 1,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return createCleanMessage(context, args);
  }
}

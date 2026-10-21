import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  text?: string,
  user?: Structures.Member | Structures.User,
}

export const COMMAND_NAME = 'rip';

export class MediaIRipCommand extends BaseInteractionCommandOption {
  description = 'Create a tombstone with some text';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.rip.description');
  metadata = {
    id: Formatter.Commands.MediaICreateTombstone.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.rip.name');

  constructor() {
    super({
      options: [
        {
          name: 'user',
          description: 'User to put on the tombstone (Default: You)',
          ...I18n.optionLocalizations('commands.media_i.fun.rip.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'text',
          description: 'Text to put on the tombstone',
          ...I18n.optionLocalizations('commands.media_i.fun.rip.text'),
          maxLength: 44,
          value: Parameters.string({maxLength: 44}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.MediaICreateTombstone.createMessage(context, {
      text: args.text || '',
      user: args.user || context.user,
    });
  }
}

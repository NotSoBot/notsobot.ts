import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'invite';

export class InfoInviteCommand extends BaseInteractionCommandOption {
  description = 'Get information of a Discord invite';
  descriptionLocalizations = I18n.localizations('commands.info.invite.description');
  metadata = {
    id: Formatter.Commands.InfoInvite.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.invite.name');

  constructor() {
    super({
      options: [
        {
          name: 'code',
          description: 'Invite Code or Link',
          ...I18n.optionLocalizations('commands.info.invite.code'),
          required: true,
          // accept full links like discord.gg/code too
          value: (value: string) => value.trim().split('/').pop() || '',
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoInvite.CommandArgsBefore) {
    return !!args.code;
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.InfoInvite.CommandArgs) {
    return Formatter.Commands.InfoInvite.createMessage(context, args);
  }
}

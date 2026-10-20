import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsPremiumServersRemoveCommand extends BaseInteractionCommandOption {
  description = 'Take your NotSoPremium Plus perks off of a server';
  descriptionLocalizations = I18n.localizations('commands.settings.premium_servers.remove.description');
  metadata = {
    id: Formatter.Commands.PremiumServersRemove.COMMAND_ID,
  };
  name = 'remove';
  nameLocalizations = I18n.localizations('commands.settings.premium_servers.remove.name');
  triggerLoadingAsEphemeral = true;

  constructor() {
    super({
      options: [
        {
          name: 'server',
          description: 'Its number from the list, or its id (this server if not given)',
          ...I18n.optionLocalizations('commands.settings.premium_servers.remove.server'),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.PremiumServersRemove.CommandArgs) {
    return Formatter.Commands.PremiumServersRemove.createMessage(context, args);
  }
}

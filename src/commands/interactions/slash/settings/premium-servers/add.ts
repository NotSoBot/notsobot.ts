import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsPremiumServersAddCommand extends BaseInteractionCommandOption {
  description = 'Give this server your NotSoPremium Plus perks, up to 2 servers';
  descriptionLocalizations = I18n.localizations('commands.settings.premium_servers.add.description');
  metadata = {
    id: Formatter.Commands.PremiumServersAdd.COMMAND_ID,
  };
  name = 'add';
  nameLocalizations = I18n.localizations('commands.settings.premium_servers.add.name');
  triggerLoadingAsEphemeral = true;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.PremiumServersAdd.CommandArgs) {
    return Formatter.Commands.PremiumServersAdd.createMessage(context, args);
  }
}

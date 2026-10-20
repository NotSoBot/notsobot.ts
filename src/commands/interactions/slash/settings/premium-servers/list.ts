import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsPremiumServersListCommand extends BaseInteractionCommandOption {
  description = 'See the servers you gave your NotSoPremium Plus to';
  descriptionLocalizations = I18n.localizations('commands.settings.premium_servers.list.description');
  metadata = {
    id: Formatter.Commands.PremiumServers.COMMAND_ID,
  };
  name = 'list';
  nameLocalizations = I18n.localizations('commands.settings.premium_servers.list.name');
  triggerLoadingAsEphemeral = true;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.PremiumServers.CommandArgs) {
    return Formatter.Commands.PremiumServers.createMessage(context, args);
  }
}

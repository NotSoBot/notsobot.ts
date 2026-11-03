import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsCreditsBalanceCommand extends BaseInteractionCommandOption {
  description = 'See how many NotSoCredits you and this server have left';
  descriptionLocalizations = I18n.localizations('commands.settings.credits.balance.description');
  metadata = {
    id: Formatter.Commands.Credits.COMMAND_ID,
  };
  name = 'balance';
  nameLocalizations = I18n.localizations('commands.settings.credits.balance.name');
  triggerLoadingAsEphemeral = true;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.Credits.CommandArgs) {
    return Formatter.Commands.Credits.createMessage(context, args);
  }
}

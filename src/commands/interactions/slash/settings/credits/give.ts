import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsCreditsGiveCommand extends BaseInteractionCommandOption {
  description = 'Give this server some of your bought NotSoCredits so everyone here can use NotSoAI';
  descriptionLocalizations = I18n.localizations('commands.settings.credits.give.description');
  metadata = {
    id: Formatter.Commands.CreditsGive.COMMAND_ID,
  };
  name = 'give';
  nameLocalizations = I18n.localizations('commands.settings.credits.give.name');

  constructor() {
    super({
      options: [
        {
          name: 'amount',
          description: 'How many to give, this can\'t be undone',
          ...I18n.optionLocalizations('commands.settings.credits.give.amount'),
          minValue: 1,
          required: true,
          type: ApplicationCommandOptionTypes.INTEGER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.CreditsGive.CommandArgs) {
    return Formatter.Commands.CreditsGive.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';

import { MeasurementUnits } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetUnitsCommand extends BaseInteractionCommandOption {
  description = 'Set your default measurement units';
  descriptionLocalizations = I18n.localizations('commands.settings.set.units.description');
  metadata = {
    id: Formatter.Commands.SettingsSetUnits.COMMAND_ID,
  };
  name = 'units';
  nameLocalizations = I18n.localizations('commands.settings.set.units.name');

  constructor() {
    super({
      options: [
        {
          name: 'units',
          description: 'Measurement Unit (Default: Imperial)',
          ...I18n.optionLocalizations('commands.settings.set.units.units'),
          choices: Parameters.Slash.oneOf({choices: MeasurementUnits, localizationKey: 'choices.measurement_units'}),
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.units.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetUnits.CommandArgs) {
    return Formatter.Commands.SettingsSetUnits.createMessage(context, args);
  }
}

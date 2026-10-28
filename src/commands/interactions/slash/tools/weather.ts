import { Interaction } from 'detritus-client';
import {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { MeasurementUnits } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'weather';

export class ToolsWeatherCommand extends BaseInteractionCommandOption {
  description = 'Show the weather of a location';
  descriptionLocalizations = I18n.localizations('commands.tools.weather.description');
  metadata = {
    id: Formatter.Commands.ToolsWeather.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.weather.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Location', ...I18n.optionLocalizations('commands.tools.weather.query'), required: true, onAutoComplete: Parameters.AutoComplete.locations},
        {name: 'units', description: 'Units to Use', ...I18n.optionLocalizations('commands.tools.weather.units'), choices: Parameters.Slash.oneOf({choices: MeasurementUnits, localizationKey: 'choices.measurement_units'})},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsWeather.CommandArgs) {
    return Formatter.Commands.ToolsWeather.createMessage(context, args);
  }
}

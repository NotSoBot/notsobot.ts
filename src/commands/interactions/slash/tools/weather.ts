import { Interaction } from 'detritus-client';
import {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { MeasurementUnits } from '../../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'weather';

export class ToolsWeatherCommand extends BaseInteractionCommandOption {
  description = 'Get the Weather of Some Place';
  metadata = {
    id: Formatter.Commands.ToolsWeather.COMMAND_ID,
  };
  name = COMMAND_NAME;

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
        {name: 'query', description: 'Location', required: true, onAutoComplete: Parameters.AutoComplete.locations},
        {name: 'units', description: 'Units to Use', choices: Parameters.Slash.oneOf({choices: MeasurementUnits})},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsWeather.CommandArgs) {
    return Formatter.Commands.ToolsWeather.createMessage(context, args);
  }
}

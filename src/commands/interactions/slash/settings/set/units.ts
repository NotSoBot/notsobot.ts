import { Interaction } from 'detritus-client';

import { MeasurementUnits } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetUnitsCommand extends BaseInteractionCommandOption {
  description = 'Set what your default Measurement Unit should be';
  metadata = {
    id: Formatter.Commands.SettingsSetUnits.COMMAND_ID,
  };
  name = 'units';

  constructor() {
    super({
      options: [
        {
          name: 'units',
          description: 'Measurement Unit (Default: Imperial)',
          choices: Parameters.Slash.oneOf({choices: MeasurementUnits}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetUnits.CommandArgs) {
    return Formatter.Commands.SettingsSetUnits.createMessage(context, args);
  }
}

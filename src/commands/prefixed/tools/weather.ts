import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MeasurementUnits } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'weather';

export default class WeatherCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'units', aliases: ['u'], type: Parameters.oneOf({choices: MeasurementUnits})},
      ],
      label: 'query',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Show the weather of a location',
        examples: [
          `${COMMAND_NAME} nyc`,
        ],
        id: Formatter.Commands.ToolsWeather.COMMAND_ID,
        usage: '<location> (-units <MeasurementUnits>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsWeather.CommandArgs) {
    return !!args.query;
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsWeather.CommandArgs) {
    return Formatter.Commands.ToolsWeather.createMessage(context, args);
  }
}

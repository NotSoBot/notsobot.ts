import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


const { DEFAULT_THRESHOLD, MAX_THRESHOLD, MIN_THRESHOLD } = Formatter.Commands.MediaIVManipulationColorRemove;
const thresholdNumber = Parameters.number({max: MAX_THRESHOLD, min: MIN_THRESHOLD});

export const COMMAND_NAME = 'color remove';

export default class ColorRemoveCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['color rm', 'colour remove', 'colour rm'],
      args: [
        {
          name: 'threshold',
          aliases: ['t', 'similarity', 's'],
          default: DEFAULT_THRESHOLD,
          metadata: {description: `how close a color has to be to get removed, ${MIN_THRESHOLD} to ${MAX_THRESHOLD}% (Default: ${DEFAULT_THRESHOLD})`},
          // `20%` and `20` are the same
          type: (value: string, context: Command.Context) => thresholdNumber(value.replace(/%$/, ''), context),
        },
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make a color in an Image or Video transparent, the most used color when none is given',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} white`,
          `${COMMAND_NAME} notsobot #6A5ACD`,
          `${COMMAND_NAME} 1, 85, 120 -threshold 25`,
        ],
        id: Formatter.Commands.MediaIVManipulationColorRemove.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<hex,rgb,hsl,name> (-threshold <1..100>)',
      },
      // above `color` so `color remove` doesn't get looked up as a color named "remove"
      priority: 0,
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'color', consume: true},
      ],
    });
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationColorRemove.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationColorRemove.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';

import {
  CommandCategories,
  MediaBackgroundRemovalModels,
  MediaBackgroundRemovalModelsToText,
} from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'dance';

export default class DanceCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amount', type: Number, metadata: {description: '1 to 60'}},
        {aliases: ['b'], name: 'bpm', type: Number, metadata: {description: '30 to 300'}},
        {
          name: 'model',
          aliases: ['m', 'use'],
          type: Parameters.oneOf({
            choices: MediaBackgroundRemovalModels,
            descriptions: MediaBackgroundRemovalModelsToText,
          }),
        },
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make whatever\'s in an Image or Video dance, squashing and stretching to a beat',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -bpm 160`,
          `${COMMAND_NAME} notsobot -amount 35`,
        ],
        id: Formatter.Commands.MediaIVManipulationDance.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <number>) (-bpm <number>) (-model <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDance.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDance.createMessage(context, args);
  }
}

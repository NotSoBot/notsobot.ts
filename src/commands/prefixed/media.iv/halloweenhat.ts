import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaFaceHalloweenHats } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'halloweenhat';

export default class HalloweenhatCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['witchhat'],
      args: [
        {name: 'hat', aliases: ['h'], type: Parameters.oneOf({choices: MediaFaceHalloweenHats})},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put a Halloween hat on every face in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -hat top hat`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceHalloweenHat.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-hat <MediaFaceHalloweenHats>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceHalloweenHat.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceHalloweenHat.createMessage(context, args);
  }
}

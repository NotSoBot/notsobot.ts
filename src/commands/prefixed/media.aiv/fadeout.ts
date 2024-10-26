import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'fadeout';

export default class FadeOutCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['c'], name: 'color'},
        {aliases: ['d'], name: 'duration', type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Add a Fade Out Animation to an Audio/Image/Video file',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaAIVManipulationFadeOut.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-color <string:FFMPEGColors|HEX|RGBA?>) (-duration <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationFadeOut.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationFadeOut.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'fadein';

export default class FadeInCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'color', aliases: ['c']},
        {name: 'duration', aliases: ['d'], type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Add a Fade In Animation to an Audio/Image/Video file',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaAIVManipulationFadeIn.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-color <string:FFMPEGColors|HEX|RGBA?>) (-duration <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationFadeIn.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationFadeIn.createMessage(context, args);
  }
}

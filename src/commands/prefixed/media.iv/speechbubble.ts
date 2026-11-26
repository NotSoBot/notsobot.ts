import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaSpeechBubbleDirections } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'speechbubble';

export default class SpeechBubbleCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['speech bubble', 'speechballoon'],
      args: [
        {name: 'direction', aliases: ['d', 'tail'], type: Parameters.oneOf({choices: MediaSpeechBubbleDirections})},
        {name: 'white', aliases: ['w'], type: Boolean, metadata: {description: 'white bubble instead of a cut out one'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Cut a speech bubble out of the top of an Image or Video, its tail pointing at the face',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -direction right`,
          `${COMMAND_NAME} notsobot -white`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlaySpeechBubble.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-direction <choice>) (-white)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlaySpeechBubble.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlaySpeechBubble.createMessage(context, args);
  }
}

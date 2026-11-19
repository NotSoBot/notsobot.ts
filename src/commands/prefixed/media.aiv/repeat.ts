import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'repeat';

export default class RepeatCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'duration', aliases: ['d'], type: 'float', metadata: {description: 'repeat it until this many seconds instead'}},
      ],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Play a Media some times in a row (or over and over until some seconds)',
        examples: [
          `${COMMAND_NAME}`,
          `${COMMAND_NAME} 4`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -duration 60`,
        ],
        id: Formatter.Commands.MediaAIVManipulationRepeat.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<times:number> (-duration <seconds>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'amount', consume: true, type: Number},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationRepeat.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationRepeat.createMessage(context, args);
  }
}

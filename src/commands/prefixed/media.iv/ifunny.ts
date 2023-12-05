import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'ifunny';

export default class IFunnyCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Attach an iFunny Label on an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationLabelsIFunny.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationLabelsIFunny.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLabelsIFunny.createMessage(context, args);
  }
}

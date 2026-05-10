import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, } from '../../../constants';
import { Formatter, DefaultParameters } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'image';

export default class ImageCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
  
      aliases: ['img', 'im'],
      args: [
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
      ],
      metadata: {
      category: CommandCategories.SEARCH,
      description: 'Search Images from Bing, DuckDuckGo, or Google.',
      examples: [
        `${COMMAND_NAME} notsobot`,
        `${COMMAND_NAME} something nsfw -safe`,
        `${COMMAND_NAME} notsobot -randomize`,
        `${COMMAND_NAME} notsobot -r`,
      ],
      id: Formatter.Commands.SearchImages.COMMAND_ID,
      usage: '<query> (-randomize) (-safe)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchImages.CommandArgs) {
    return Formatter.Commands.SearchImages.createMessage(context, args);
  }
}

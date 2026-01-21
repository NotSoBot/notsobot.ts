import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'crop triangle';

export default class CropTriangleCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
	super(client, {
	  name: COMMAND_NAME,

	  metadata: {
		category: CommandCategories.IMAGE,
		description: 'Crop out a Triangle from an Image or Video',
		examples: [
		  COMMAND_NAME,
		  `${COMMAND_NAME} notsobot`,
		],
		id: Formatter.Commands.MediaIVToolsCropTriangle.COMMAND_ID,
		usage: '?<emoji,user:id|mention|name,url>',
	  },
	});
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsCropTriangle.CommandArgs) {
	return Formatter.Commands.MediaIVToolsCropTriangle.createMessage(context, args);
  }
}

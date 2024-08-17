import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay face';

export default class OverlayFaceCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
	super(client, {
	  name: COMMAND_NAME,

	  aliases: ['o face'],
	  metadata: {
		category: CommandCategories.IMAGE,
		description: 'Overlay media onto the face of another media',
		examples: [
		  `${COMMAND_NAME} @cakedan @notsobot`,
		],
		id: Formatter.Commands.MediaIVManipulationOverlayFace.COMMAND_ID,
		usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url>',
	  },
	  minAmount: 2,
	});
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFace.CommandArgs) {
	return Formatter.Commands.MediaIVManipulationOverlayFace.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio channels invert';

export default class AudioChannelsInvertCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
	super(client, {
	  name: COMMAND_NAME,

	  aliases: ['a channels invert', 'a c invert'],
	  metadata: {
		category: CommandCategories.TOOLS,
		description: 'Swap the left and right audio channels of an Audio or Video file',
		examples: [
		  `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
		],
		id: Formatter.Commands.MediaAVManipulationAudioChannelsInvert.COMMAND_ID,
		usage: '?<emoji,user:id|mention|name,url>',
	  },
	});
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioChannelsInvert.CommandArgs) {
	return Formatter.Commands.MediaAVManipulationAudioChannelsInvert.createMessage(context, args);
  }
}

import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio channels combine';

export default class AudioChannelsCombineCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
	super(client, {
	  name: COMMAND_NAME,

	  aliases: ['a channels combine', 'a c combine'],
	  metadata: {
		category: CommandCategories.AUDIO,
		description: 'Combine an Audio or Video file\'s audio streams to be mono',
		examples: [
		  `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/stereo.mp3`,
		],
		id: Formatter.Commands.MediaAVManipulationAudioChannelsCombine.COMMAND_ID,
		usage: '?<emoji,user:id|mention|name,url>',
	  },
	});
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioChannelsCombine.CommandArgs) {
	return Formatter.Commands.MediaAVManipulationAudioChannelsCombine.createMessage(context, args);
  }
}

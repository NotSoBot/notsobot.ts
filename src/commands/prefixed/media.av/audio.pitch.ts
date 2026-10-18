import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio pitch';

export default class AudioPitchCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
	  super(client, {
	    name: COMMAND_NAME,
  
	    aliases: ['a pitch'],
	    args: [
		    {name: 'scale', aliases: ['s'], metadata: {description: 'Pitch Scale (0.17 to 2, default: 2.0)'}},
	    ],
	    metadata: {
		  category: CommandCategories.AUDIO,
		  description: 'Manipulate an audio or video file\'s pitch',
		  examples: [
        `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
		  ],
		  id: Formatter.Commands.MediaAVManipulationAudioPitch.COMMAND_ID,
		  usage: '?<emoji,user:id|mention|name,url> (-scale <float>)',
	    },
	  });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioPitch.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioPitch.createMessage(context, args);
  }
}

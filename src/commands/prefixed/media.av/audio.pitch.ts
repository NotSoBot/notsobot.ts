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
		  description: 'Change an Audio or Video\'s pitch',
		  examples: [
        `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3`,
        `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -scale 0.5`,
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

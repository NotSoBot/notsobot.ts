import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'audio paulstretch';

export default class AudioPaulstretchCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a paulstretch', 'paulstretch'],
      args: [
        {name: 'resolution', aliases: ['r', 'time'], metadata: {description: 'Seconds of sound smeared together (0.01 to 10, default: 1.6)'}},
        {name: 'stretch', aliases: ['s'], metadata: {description: 'How many times longer it gets (1 to 50, default: 2.0)'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Stretch an Audio or Video into a slow, smeared ambient drone, like Audacity\'s Paulstretch',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 -stretch 10 -resolution 0.25`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioPaulstretch.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-stretch <float>) (-resolution <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationAudioPaulstretch.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioPaulstretch.createMessage(context, args);
  }
}

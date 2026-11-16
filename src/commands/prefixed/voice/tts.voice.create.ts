import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice create';

export default class TTSVoiceCreateCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['voice clone'],

      args: [
        {name: 'name', metadata: {description: '1 to 128 characters'}},
        {name: 'platform', metadata: {description: 'zonos3 (free, the default) or fish (uses NotSoCredits)'}, type: Parameters.oneOf({choices: Formatter.Commands.VoiceList.VoiceClonePlatforms, descriptions: Formatter.Commands.VoiceList.VoiceClonePlatformsToText})},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Clone a voice from an Audio or Video File to use for Text-to-Speech',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -name cake`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -name cake -platform fish`,
        ],
        id: Formatter.Commands.VoiceClone.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-name <string>) (-platform <zonos3|fish>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceClone.CommandArgs) {
    return Formatter.Commands.VoiceClone.createMessage(context, args);
  }
}

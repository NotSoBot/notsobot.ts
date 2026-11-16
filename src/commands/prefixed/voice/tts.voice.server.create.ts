import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice server create';

export default class TTSVoiceServerCreateCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['server voice create'],

      disableDm: true,

      args: [
        {name: 'name', metadata: {description: '1 to 128 characters'}},
        {name: 'platform', metadata: {description: 'zonos3 (free, the default) or fish (uses NotSoCredits)'}, type: Parameters.oneOf({choices: Formatter.Commands.VoiceList.VoiceClonePlatforms, descriptions: Formatter.Commands.VoiceList.VoiceClonePlatformsToText})},
      ],
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Clone a voice for everyone in the server from an Audio or Video File',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -name narrator`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -name narrator -platform fish`,
        ],
        id: Formatter.Commands.VoiceServer.COMMAND_ID_CREATE,
        usage: '?<emoji,user:id|mention|name,url> (-name <string>) (-platform <zonos3|fish>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceClone.CommandArgs) {
    return Formatter.Commands.VoiceClone.createMessage(context, {...args, server: true});
  }
}

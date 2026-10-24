import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts play';

export default class TTSPlayCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {
          name: 'use',
          type: Parameters.textToSpeechVoice,
        },
      ],
      disableDm: true,
      label: 'text',
      metadata: {
        description: 'Say Text to Speech in your voice channel (queued like a song)',
        examples: [
          `${COMMAND_NAME} give me a table`,
          `${COMMAND_NAME} give me a table -use klattsch`,
        ],
        category: CommandCategories.MUSIC,
        // like `music play`: premium users, premium servers and servers given the feature (`owner guild features add`)
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicTTS.COMMAND_ID,
        usage: '<text> (-use <language/type>)',
      },
      type: Parameters.targetTextWithParsedMentions,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MusicTTS.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicTTS.CommandArgs) {
    return Formatter.Commands.MusicTTS.createMessage(context, args);
  }
}

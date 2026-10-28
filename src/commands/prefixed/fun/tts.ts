import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories, TTSVoices, TTSVoicesToText, TTS_VOICES } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts';

export default class TTSCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['texttospeech'],
      args: [
        {
          name: 'use',
          type: Parameters.textToSpeechVoice,
        },
      ],
      label: 'text',
      metadata: {
        category: CommandCategories.AUDIO,
        pipeable: false,
        description: 'Generate Text to Speech',
        examples: [
          `${COMMAND_NAME} give me a table`,
          `${COMMAND_NAME} give me a table -use klattsch`,
        ],
        id: Formatter.Commands.FunTTS.COMMAND_ID,
        usage: '<text> (-use <language/type>)',
      },
      // after the `tts voice ...` commands, otherwise `tts voice list` would say "voice list"
      priority: -1,
      type: Parameters.targetTextWithParsedMentions,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunTTS.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.FunTTS.CommandArgs) {
    return Formatter.Commands.FunTTS.createMessage(context, args);
  } 
}

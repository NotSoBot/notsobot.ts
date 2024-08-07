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
        category: CommandCategories.FUN,
        description: 'Text to Speech',
        examples: [
          `${COMMAND_NAME} give me a table`,
          `${COMMAND_NAME} give me a table -use kate`,
        ],
        id: Formatter.Commands.FunTTS.COMMAND_ID,
        usage: '<text> (-use <language/type>)',
      },
      type: Parameters.targetText,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunTTS.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.FunTTS.CommandArgs) {
    return Formatter.Commands.FunTTS.createMessage(context, args);
  } 
}

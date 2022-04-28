import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories, TTSVoices, TTS_VOICES } from '../../../constants';
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
          choices: TTS_VOICES,
          help: `Must be one of (${TTS_VOICES.map((x) => Markup.codestring(x)).join(', ')})`,
          type: Parameters.oneOf<TTSVoices>({choices: TTSVoices}),
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
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunTTS.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.FunTTS.CommandArgs) {
    return Formatter.Commands.FunTTS.createMessage(context, args);
  } 
}

import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { funTextToSpeech } from '../../api';
import { CommandTypes, TTSVoices, TTS_VOICES } from '../../constants';
import { Parameters, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';



export interface CommandArgsBefore {
  text: string,
  use: TTSVoices,
}

export interface CommandArgs {
  text: string,
  use: TTSVoices,
}

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
          default: TTSVoices.BLUE_EN_US_ALLISON,
          help: `Must be one of (${TTS_VOICES.map((x) => Markup.codestring(x)).join(', ')})`,
          type: Parameters.oneOf<TTSVoices>({choices: TTSVoices}),
        },
      ],
      label: 'text',
      metadata: {
        description: 'Text to Speech',
        examples: [
          `${COMMAND_NAME} give me a table`,
          `${COMMAND_NAME} give me a table -use kate`,
        ],
        type: CommandTypes.FUN,
        usage: '<text> (-use <language/type>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text;
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await funTextToSpeech(context, {text: args.text, voice: (TTSVoices as any)[args.use]});
    const filename = response.headers.get('x-file-name') || 'tts.mp3';
    return editOrReply(context, {file: {filename, value: await response.buffer()}});
  }
}

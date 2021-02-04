import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { funTextToSpeech } from '../../api';
import { CommandTypes } from '../../constants';
import { editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';



export const TTSVoices = Object.freeze({
  DE_DE_DIETER: 'BLUE_DE_DE_DIETER',
  EN_GB_KATE: 'BLUE_EN_GB_KATE',
  EN_US_ALLISON: 'BLUE_EN_US_ALLISON',
  EN_US_LISA: 'BLUE_EN_US_LISA',
  EN_US_MICHAEL: 'BLUE_EN_US_MICHAEL',
  ES_ES_ENRIQUE: 'BLUE_ES_ES_ENRIQUE',
  FR_FR_RENEE: 'BLUE_FR_FR_RENEE',
  IT_IT_FRANCESCA: 'BLUE_IT_IT_FRANCESCA',
  JA_JP_EMI: 'BLUE_JA_JP_EMI',
  PT_BR_ISABELA: 'PT_BR_ISABELA',
});

export const TTS_VOICES = Object.keys(TTSVoices);


export interface CommandArgsBefore {
  text: string,
  use: string,
}

export interface CommandArgs {
  text: string,
  use: string,
}

export const COMMAND_NAME = 'text-to-speech';

export default class TTSCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tts'],
      args: [
        {
          name: 'use',
          choices: TTS_VOICES,
          default: 'EN_US_ALLISON',
          help: `Must be one of (${TTS_VOICES.map((x) => Markup.codestring(x)).join(', ')})`,
          type: (value: string) => {
            let parts: Array<string>;
            if (value.includes('_')) {
              parts = value.toUpperCase().split('_');
            } else {
              parts = value.toUpperCase().split(' ');
            }
            for (let voice of TTS_VOICES) {
              const voiceParts = voice.split('_');
              if (parts.every((part) => voiceParts.includes(part))) {
                return voice;
              }
            }
            return value;
          },
        },
      ],
      label: 'text',
      metadata: {
        description: 'Text to Speech',
        examples: [
          `${COMMAND_NAME} give me a table`,
          `${COMMAND_NAME} give me a table -use spanish`,
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

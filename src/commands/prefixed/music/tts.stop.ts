import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts stop';

export interface CommandArgs {
  text: string,
  use?: Formatter.Commands.FunTTS.CommandArgs['use'],
}

export default class TTSStopCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {
          name: 'use',
          type: Parameters.textToSpeechVoice,
        },
      ],
      label: 'text',
      metadata: {
        description: 'Stop the Text to Speech being said in the voice channel. Your own, or anyone\'s with Manage Server, the DJ role, Manage Channel on the bot\'s voice channel, or DJ mode off',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicTTSStop.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    // `tts stop doing that` is still `tts` saying "stop doing that" (this command comes before it), only `tts stop` by
    // itself stops
    if (args.text) {
      const text = await Parameters.targetTextWithParsedMentions(`stop ${args.text}`, context);
      return Formatter.Commands.FunTTS.createMessage(context, {text, use: args.use});
    }
    // dms have no voice channel, it says nothing's being said
    return Formatter.Commands.MusicTTSStop.createMessage(context);
  }
}

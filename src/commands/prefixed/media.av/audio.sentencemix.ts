import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'sentencemix';

export interface CommandArgsBefore {
  gap?: number,
  sentence?: string,
  skipmissing?: boolean,
  url?: null | string,
}

export default class AudioSentenceMixCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['sentence mix', 'audio sentencemix', 'a sentencemix'],
      args: [
        {name: 'skipmissing', aliases: ['s'], type: Boolean, metadata: {description: 'leave out words that aren\'t said instead of failing'}},
        {name: 'gap', aliases: ['g'], type: Number, metadata: {description: '0 to 1000 (ms)'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Make an Audio or Video say a sentence by cutting together the words said in it',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 try this on your bad voice`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 i can do that -gap 100 -skipmissing`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioSentenceMix.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <sentence> (-skipmissing) (-gap <number>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: true, image: false, video: true})},
        {name: 'sentence', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    if (!args.sentence?.trim()) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_sentence_found'));
    }
    return Formatter.Commands.MediaAVManipulationAudioSentenceMix.createMessage(context, {
      gap: args.gap,
      sentence: args.sentence,
      skipmissing: args.skipmissing,
      url: args.url!,
    });
  }
}

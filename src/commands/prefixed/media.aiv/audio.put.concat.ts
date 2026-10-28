import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'audio put concat';

export default class AudioPutConcatCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['a put concat'],
      args: [
        {name: 'longest', aliases: ['l'], type: Boolean},
        {name: 'noloop', aliases: ['nl'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Concat an Audio/Image/Video\'s audio with another audio file',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 @cakedan`,
        ],
        id: Formatter.Commands.MediaAIVManipulationAudioPutConcat.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-longest) (-noloop)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationAudioPutConcat.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationAudioPutConcat.createMessage(context, args);
  }
}

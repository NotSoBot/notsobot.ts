import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice move';

export default class TTSVoiceMoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['voice move'],

      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Move one of your cloned voices between ZONOS3 (free) and fish.audio (uses NotSoCredits), to the other one when no platform is given',
        examples: [
          `${COMMAND_NAME} chewbacca`,
          `${COMMAND_NAME} chewbacca fish`,
          `${COMMAND_NAME} chewbacca zonos3`,
        ],
        id: Formatter.Commands.VoiceMove.COMMAND_ID,
        usage: '<voice:string> ?<platform:zonos3|fish>',
      },
      type: [
        {name: 'voice'},
        {name: 'platform', type: Parameters.oneOf({choices: Formatter.Commands.VoiceList.VoiceClonePlatforms, descriptions: Formatter.Commands.VoiceList.VoiceClonePlatformsToText})},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.VoiceMove.CommandArgs) {
    return !!args.voice;
  }

  async run(context: Command.Context, args: Formatter.Commands.VoiceMove.CommandArgs) {
    return Formatter.Commands.VoiceMove.createMessage(context, args);
  }
}

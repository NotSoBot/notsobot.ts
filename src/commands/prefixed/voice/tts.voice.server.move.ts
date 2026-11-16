import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tts voice server move';

export default class TTSVoiceServerMoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['server voice move'],

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Move one of the server\'s cloned voices between ZONOS3 (free) and fish.audio (uses NotSoCredits), to the other one when no platform is given',
        examples: [
          `${COMMAND_NAME} narrator`,
          `${COMMAND_NAME} narrator fish`,
          `${COMMAND_NAME} narrator zonos3`,
        ],
        id: Formatter.Commands.VoiceServer.COMMAND_ID_MOVE,
        usage: '<voice:string> ?<platform:zonos3|fish>',
      },
      permissions: [Permissions.MANAGE_GUILD],
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
    return Formatter.Commands.VoiceMove.createMessage(context, {...args, server: true});
  }
}

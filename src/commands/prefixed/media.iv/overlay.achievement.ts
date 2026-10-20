import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay achievement';

// a leading `50G` sets the gamerscore, like `overlay achievement 50G touched grass`
const GAMERSCORE_PREFIX = /^(\d{1,4})g\s+/i;

export default class OverlayAchievementCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o achievement', 'achievement'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an Xbox "Achievement unlocked" popup with your own text on an Image or Video',
        examples: [
          `${COMMAND_NAME} Posted cringe`,
          `${COMMAND_NAME} @NotSoBot 50G Touched grass`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayAchievement.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<gamerscore>G <...text>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', type: Parameters.parsedMentionsText, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayAchievement.CommandArgs) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayAchievement.CommandArgs) {
    const match = args.text.match(GAMERSCORE_PREFIX);
    if (match && args.text.length > match[0].length) {
      args.gamerscore = parseInt(match[1]);
      args.text = args.text.slice(match[0].length);
    }
    return Formatter.Commands.MediaIVManipulationOverlayAchievement.createMessage(context, args);
  }
}

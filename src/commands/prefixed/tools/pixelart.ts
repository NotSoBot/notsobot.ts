import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, CommandRatelimits, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'pixelart';

export default class PixelartCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'seed', type: Number, metadata: {description: 'initial noise (at least 1)'}},
      ],
      label: 'query',
      metadata: {
        category: CommandCategories.AI,
        credits: Formatter.Commands.ToolsMLPixelart.CREDITS,
        // the same as the slash command's english description, the site matches translations by it
        description: 'Make 16x16 pixel art sprites from a prompt',
        examples: [
          `${COMMAND_NAME} golden crown with blue gems`,
          `${COMMAND_NAME} green slime monster -seed 5`,
        ],
        id: Formatter.Commands.ToolsMLPixelart.COMMAND_ID,
        usage: '<...query> (-seed <number>)',
      },
      ratelimits: CommandRatelimits.ML_IMAGE,
      type: Parameters.targetTextWithParsedMentions,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsMLPixelart.CommandArgs) {
    return !!args.query;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ToolsMLPixelart.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.needs_text')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLPixelart.CommandArgs) {
    return Formatter.Commands.ToolsMLPixelart.createMessage(context, args);
  }
}

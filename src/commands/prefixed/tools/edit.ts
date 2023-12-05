import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'edit';

export default class EditCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'count', aliases: ['c'], type: Number, metadata: {description: 'grid size (1..4)'}},
        {name: 'guidance', type: 'float', metadata: {description: 'influence of prompt on sampling (-Inf..Inf)'}},
        {name: 'no', metadata: {escription: 'negative prompt'}},
        {name: 'seed', type: Number, metadata: {description: 'initial noise'}},
        {name: 'steps', type: Number, metadata: {description: 'number of samples to take (2..50)'}},
        {name: 'strength', type: 'float', metadata: {description: 'strength of prompt (0.05..1)'}},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Alter an Image with machine learning (thanks evan)',
        examples: [
          `${COMMAND_NAME} an animal eating strawberries`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png an animal eating strawberries -guidance 50`,
        ],
        id: Formatter.Commands.ToolsMLEdit.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...query> (-count <number>) (-guidance <number>) (-no <query>) (-seed <number>) (-steps <number>) (-strength <number>)',
      },
      ratelimits: [
        {duration: 10000, limit: 3, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'guild'},
        {duration: 5000, limit: 1, key: Formatter.Commands.ToolsMLEdit.COMMAND_ID, type: 'channel'},
      ],
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, video: false})},
        {name: 'query', type: Parameters.targetText, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsMLEdit.CommandArgs) {
    return !!args.query && super.onBeforeRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLEdit.CommandArgs) {
    return Formatter.Commands.ToolsMLEdit.createMessage(context, args);
  }
}

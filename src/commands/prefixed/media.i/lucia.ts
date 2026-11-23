import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'lucia';

export default class LuciaCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['playwithlucia'],
      args: [
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: Formatter.Commands.MediaICreateLucia.MAX_NAME_LENGTH}), metadata: {description: 'who will appreciate it, instead of Lucia'}},
        {name: 'portrait', aliases: ['p'], type: Parameters.mediaUrl({audio: false, onlyContent: true}), metadata: {description: 'an image, gif or video instead of Lucia, one that moves makes the card move'}},
        {name: 'title', aliases: ['t'], type: Parameters.string({maxLength: Formatter.Commands.MediaICreateLucia.MAX_TITLE_LENGTH}), metadata: {description: 'the headline, PLAY WITH LUCIA by default'}},
      ],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make a "Play with Lucia" prompt from GTA 6 with your own text, title, name and portrait',
        examples: [
          `${COMMAND_NAME} Hop on Deadlock`,
          `${COMMAND_NAME} Help me move a couch -title moving day`,
          `${COMMAND_NAME} Go to bed before 3am -title sleep schedule -name @notsobot -portrait @notsobot`,
          `${COMMAND_NAME} Dance with me -portrait https://cdn.nsb.gg/assets/samples/animated.gif`,
        ],
        id: Formatter.Commands.MediaICreateLucia.COMMAND_ID,
        usage: '<text> (-name <text>) (-portrait <emoji,user:id|mention|name,url>) (-title <text>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateLucia.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateLucia.CommandArgs) {
    return Formatter.Commands.MediaICreateLucia.createMessage(context, args);
  }
}

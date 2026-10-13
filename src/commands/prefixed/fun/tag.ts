import { Command, CommandClient } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  arguments: Array<string>,
  tag: false | null | RestResponsesRaw.Tag,
}

export const COMMAND_NAME = 'tag';

export default class TagCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t', 'tag show', 't show'],
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Show a tag',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} "some tag"`,
          `${COMMAND_NAME} "some tag" arg1`,
        ],
        id: Formatter.Commands.TagShow.COMMAND_ID,
        usage: '<tagname> <...arguments>',
      },
      priority: -1,
      type: [
        {name: 'tag', default: null, type: Parameters.NotSoTag},
        {name: 'arguments', consume: true},
      ],
    });
  }

  onBefore(context: Command.Context) {
    return false;
  }

  async onCancel(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, [
      '',
      `### ${StatusEmojis.WARNING} ${translate('tag.disabled_title')}`,
      translate('tag.disabled_body', {invite: '<https://notsobot.com/support/invite>'}),
      '',
    ].join('\n'));
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.unknown')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.TagShow.CommandArgs) {
    return Formatter.Commands.TagShow.createMessage(context, args);
  }
}

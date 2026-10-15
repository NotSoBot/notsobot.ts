import { Command, CommandClient } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { CommandCategories, ReportTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { sendReport } from '../utils/report.bug';


export interface CommandArgs {
  content: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export const COMMAND_NAME = 'tag report';

export default class TagReportCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t report', 'report tag'],
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Report a tag to the NotSoBot developers',
        examples: [
          `${COMMAND_NAME} something posts nsfw images`,
          `${COMMAND_NAME} "some tag" spams pings`,
        ],
        id: Formatter.Commands.Report.COMMAND_ID_TAG,
        usage: '<tagname> <reason>',
      },
      priority: -1,
      type: [
        {name: 'tag', default: null, type: Parameters.NotSoTag},
        {name: 'content', type: Parameters.string({maxLength: Formatter.Commands.Report.MAX_CONTENT_LENGTH}), consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return sendReport(this, context, {
      content: args.content,
      tag: args.tag,
      type: ReportTypes.TAG,
    });
  }
}

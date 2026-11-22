import { Command, CommandClient } from 'detritus-client';

import { CommandResults, setCommandReason, setCommandResult } from '../../../commandresults';
import { CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'url';

export interface CommandArgs {
  audio?: boolean,
  image?: boolean,
  value: string,
  video?: boolean,
}

export default class URLCommand extends BaseCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'audio', aliases: ['a'], type: Boolean},
        {name: 'image', aliases: ['i'], type: Boolean},
        {name: 'video', aliases: ['v'], type: Boolean},
      ],
      label: 'value',
      metadata: {
        category: CommandCategories.UTILITY,
        description: 'Get the url of any media or file (the last one in chat, a reply, a user\'s avatar or an emoji)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} ^2`,
          `${COMMAND_NAME} -video`,
          `${COMMAND_NAME} -audio -video`,
          `${COMMAND_NAME} @user`,
        ],
        id: Formatter.Commands.ToolsUrl.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-audio) (-image) (-video)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    // the flags pick which kinds of media count (none given, any attachment, text files too), so the media is found
    // here instead of by the command's `type`, whose search options are fixed
    const any = !(args.audio || args.image || args.video);
    const findUrl = Parameters.lastMediaUrl({
      audio: any || !!args.audio,
      image: any || !!args.image,
      text: any,
      video: any || !!args.video,
    });

    const url = await findUrl(args.value, context);
    if (!url) {
      // the media is looked for in here (see above), so it's `run` that finds nothing: recorded like the media
      // commands' own "no media found" instead of as a use that ran
      setCommandResult(context, CommandResults.CANCELLED);
      setCommandReason(context, (url === null) ? 'invalid_media' : 'no_media');
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate((url === null) ? 'errors.invalid_user_or_url' : 'errors.no_media_found'));
    }
    return Formatter.Commands.ToolsUrl.createMessage(context, {url});
  }
}

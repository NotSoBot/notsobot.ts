import { Interaction, Structures } from 'detritus-client';
import {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { CommandRatelimits } from '../../../constants';
import { I18n } from '../../../utils';
import { editorTemplateCodeOf, launchEditor, recordLaunchEnd, refuseCommandLaunch, replyPrivately } from '../../../utils/editoractivity';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_ID = 'editor';

export interface EditorCommandArgs {
  attachment?: Structures.Attachment,
  template?: string,
  url?: string,
}


// a plain http(s) link, checked here instead of `Parameters.url` (that one turns mentions into avatars, which can wait
// on discord, and this has 3 seconds to launch)
function mediaUrlOf(args: EditorCommandArgs): string | null {
  if (args.attachment && args.attachment.url) {
    return args.attachment.url;
  }
  const text = (args.url || '').trim().replace(/^<(.*)>$/, '$1');
  if (!text) {
    return null;
  }
  try {
    const url = new URL(text);
    return (url.protocol === 'https:' || url.protocol === 'http:') ? url.toString() : null;
  } catch {
    return null;
  }
}


// /editor: the media editor activity, on an attachment or a link when one's given (its start screen otherwise). The
// same launch as the "Launch" entry point and Edit Media's
export default class EditorCommand extends BaseSlashCommand {
  description = 'Edit media with effects, text and drawings';
  descriptionLocalizations = I18n.localizations('commands.editor.description');
  metadata = {
    id: COMMAND_ID,
  };
  name = 'editor';

  // the launch has to be the interaction's first answer, nothing defers it (`answersItselfFirst`), so the channel checks
  // a defer would have done are made in `run`
  launchesActivity = true;
  triggerLoadingAfter = -1;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      // its own bucket (shared with `/games play` and the Launch entry point), not the channel's media one: it runs no job
      ratelimits: CommandRatelimits.ACTIVITY,
      options: [
        {
          name: 'attachment',
          description: 'Media file to edit',
          ...I18n.optionLocalizations('commands.editor.attachment'),
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
        {
          name: 'url',
          description: 'Link to the media to edit',
          ...I18n.optionLocalizations('commands.editor.url'),
        },
        {
          name: 'template',
          description: 'Editor template link to start from',
          ...I18n.optionLocalizations('commands.editor.template'),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: EditorCommandArgs) {
    // the gate: who the editor's open to, an App Channel bound to NotSoBot (it has the editor open inline, another
    // launch there would only stack a second one), the decoy channel and a channel the server turned NotSoBot off in
    // (an activity would post that it started)
    if (await refuseCommandLaunch(context, 'command')) {
      return;
    }
    // (the cached translator: these are the interaction's first answer like the launch, nothing may wait on the api)
    if (args.url && !args.attachment && !mediaUrlOf(args)) {
      recordLaunchEnd(context, 'launch_bad_url');
      return replyPrivately(context, I18n.getCachedTranslator(context).translate('editor_activity.bad_url'), true);
    }
    const templateCode = (args.template) ? editorTemplateCodeOf(args.template) : null;
    if (args.template && !templateCode) {
      recordLaunchEnd(context, 'launch_bad_template');
      return replyPrivately(context, I18n.getCachedTranslator(context).translate('editor_activity.bad_template'), true);
    }
    await launchEditor(context, {surface: 'command', mediaUrl: mediaUrlOf(args), templateCode});
  }
}

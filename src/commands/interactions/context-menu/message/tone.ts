import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { Formatter, I18n, displayReply } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export interface ToneCommandArgs extends ContextMenuMessageArgs {
  text: string,
}

export const COMMAND_NAME = 'Tone';

export default class ToneCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.ToolsTone.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.tone.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  onBeforeRun(context: Interaction.InteractionContext, args: ToneCommandArgs) {
    // the message's text, or its first embed's (a bot's reply)
    args.text = args.message.content;
    if (!args.text) {
      for (let [embedId, embed] of args.message.embeds) {
        if (embed.description) {
          args.text = embed.description;
          break;
        }
      }
    }
    // the api takes up to 4000 characters, the rest wouldn't fit in its 512 tokens anyway
    args.text = (args.text || '').slice(0, 4000);
    return !!args.text.trim();
  }

  async onCancelRun(context: Interaction.InteractionContext, args: ToneCommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('commands.context.tone.no_text'), ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: ToneCommandArgs) {
    // only the person who asked sees how someone else's message scored
    return Formatter.Commands.ToolsTone.createMessage(context, {
      isEphemeral: true,
      text: args.text,
    });
  }
}

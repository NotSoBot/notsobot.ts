import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'rename';

export class TagRenameCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Rename a tag';
  descriptionLocalizations = I18n.localizations('commands.tag.rename.description');
  metadata = {
    id: Formatter.Commands.TagRename.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.rename.name');

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag to rename',
          ...I18n.optionLocalizations('commands.tag.rename.tag'),
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
        {
          name: 'name',
          description: 'Tag\'s New Name',
          ...I18n.optionLocalizations('commands.tag.rename.name'),
          required: true,
          value: Parameters.tagName,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagRename.CommandArgsBefore) {
    if (args.tag && args.tag.user.id !== context.userId) {
      return false;
    }
    return !!args.tag && !!args.name;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagRename.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag !== null || args.name) {
      let content: string | null = null;
      if (args.tag === false) {
        content = translate('tag.unknown');
      } else if (!args.name) {
        content = translate('tag.rename_needs_name');
      } else if (args.tag && args.tag.user.id !== context.userId) {
        content = translate('tag.not_owner');
      }
      if (content) {
        return editOrReply(context, {content: `${StatusEmojis.WARNING} ${content}`, flags: MessageFlags.EPHEMERAL});
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagRename.CommandArgs) {
    return Formatter.Commands.TagRename.createMessage(context, args);
  }
}

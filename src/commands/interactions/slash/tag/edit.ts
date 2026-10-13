import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionTagWriteCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'edit';

export class TagEditCommand extends BaseInteractionTagWriteCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Edit a tag';
  descriptionLocalizations = I18n.localizations('commands.tag.edit.description');
  metadata = {
    id: Formatter.Commands.TagEdit.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.edit.name');

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.edit.name'),
          label: 'tag',
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
        {
          name: 'content',
          description: 'Tag\'s New Content',
          ...I18n.optionLocalizations('commands.tag.edit.content'),
          required: true,
          value: Parameters.tagContent,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagEdit.CommandArgsBefore) {
    if (args.tag && args.tag.user.id !== context.userId) {
      return false;
    }
    return !!args.tag && !!args.content;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagEdit.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag !== null || args.content) {
      let content: string | null = null;
      if (args.tag === false) {
        content = translate('tag.unknown');
      } else if (!args.content) {
        content = translate('tag.needs_content');
      } else if (args.tag && args.tag.user.id !== context.userId) {
        content = translate('tag.not_owner');
      }
      if (content) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${content}`, ephemeral: true});
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagEdit.CommandArgs) {
    return Formatter.Commands.TagEdit.createMessage(context, args);
  }
}

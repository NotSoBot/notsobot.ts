import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'dm';

export class TagImportDMCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Import a Tag from your DMs with NotSoBot';
  descriptionLocalizations = I18n.localizations('commands.tag.import.dm.description');
  metadata = {
    id: Formatter.Commands.TagImportDM.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.import.dm.name');

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag to add from DM',
          ...I18n.optionLocalizations('commands.tag.import.dm.tag'),
          required: true,
          value: Parameters.tagToAdd,
          onAutoComplete: Parameters.AutoComplete.tagsToAdd,
        },
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.import.dm.name'),
          value: Parameters.tagName,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagImportDM.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagImportDM.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag !== null) {
      if (args.tag === false) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.unknown')}`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagImportDM.CommandArgs) {
    return Formatter.Commands.TagImportDM.createMessage(context, args);
  }
}

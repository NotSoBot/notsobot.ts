import { Interaction } from 'detritus-client';

import { RestResponsesRaw } from '../../../../../api/types';
import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgsBefore {
  tag: false | null | RestResponsesRaw.Tag,
}

export class TagStorageExportCommand extends BaseInteractionCommandOption {
  description = 'Export a tag with its variables and blobs (tag owner only)';
  descriptionLocalizations = I18n.localizations('commands.tag.storage.export.description');
  metadata = {
    id: Formatter.Commands.TagStorageExport.COMMAND_ID,
  };
  name = 'export';
  nameLocalizations = I18n.localizations('commands.tag.storage.export.name');
  triggerLoadingAfter = 100;
  triggerLoadingAsEphemeral = true;

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.storage.export.tag'),
          label: 'tag',
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.unknown')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagStorageExport.CommandArgs) {
    return Formatter.Commands.TagStorageExport.createMessage(context, args);
  }
}

import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  MessageComponentInputTextStyles,
  MessageComponentTypes,
} from 'detritus-client/lib/constants';
import { InteractionModal, InteractionModalArgs, InteractionModalContext } from 'detritus-client/lib/utils';

import { EmbedColors, ReportTypes } from '../../../constants';
import { Formatter, I18n, Parameters, renderDisplay } from '../../../utils';

import { createRunErrorPayload, warning } from '../../errors';
import { BaseSlashCommand, translateErrorLabel } from '../basecommand';


export const COMMAND_NAME = 'report';

const MAX_SERVER_ID_LENGTH = 20;

export default class ReportCommand extends BaseSlashCommand {
  description = 'Send a report to the NotSoBot developers';
  descriptionLocalizations = I18n.localizations('commands.report.description');
  metadata = {
    id: Formatter.Commands.Report.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.report.name');
  // a deferred interaction can't respond with a modal anymore
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

  async run(context: Interaction.InteractionContext) {
    const { translate } = await I18n.getTranslator(context);

    const modal = new InteractionModal({
      title: translate('report.modal_title'),
      run: async (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
        const type = ReportTypes[(args.type || 'bug').toUpperCase() as keyof typeof ReportTypes];
        const userId = (Array.isArray(args.user) && args.user.length) ? args.user[0] : null;
        const payload = await Formatter.Commands.Report.createPayload(context, {
          content: args.content,
          server: (args.server_id || '').trim() || undefined,
          type,
          user: (userId) ? await Parameters.memberOrUser()(userId, context) : undefined,
        });
        return modalContext.editOrRespond(await renderDisplay(context, payload));
      },
      onError: async (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => {
        const translator = await I18n.getTranslator(context);
        const title = warning(translator.translate('errors.run_title', {label: translateErrorLabel('Slash', translator.translate)}));
        const payload = await createRunErrorPayload(context, title, error, translator);
        return modalContext.editOrRespond(await renderDisplay(context, {
          color: EmbedColors.ERROR,
          description: payload.description,
          ephemeral: true,
          fields: payload.fields,
          title: payload.title,
        }));
      },
    });

    const type = modal.createRadioGroup({label: translate('report.modal_type')}, {customId: 'type', required: true});
    type.createOption({
      default: true,
      description: translate('report.modal_type_bug_description'),
      label: translate('report.modal_type_bug'),
      value: 'bug',
    });
    type.createOption({
      description: translate('report.modal_type_user_description'),
      label: translate('report.modal_type_user'),
      value: 'user',
    });
    type.createOption({
      description: translate('report.modal_type_server_description'),
      label: translate('report.modal_type_server'),
      value: 'server',
    });

    modal.createSelectMenu({
      description: translate('report.modal_user_description'),
      label: translate('report.modal_user'),
    }, {
      customId: 'user',
      maxValues: 1,
      minValues: 0,
      required: false,
      type: MessageComponentTypes.USER_SELECT,
    });

    modal.createLabel({
      description: translate('report.modal_server_id_description'),
      label: translate('report.modal_server_id'),
    }).createInputText({
      customId: 'server_id',
      maxLength: MAX_SERVER_ID_LENGTH,
      required: false,
      style: MessageComponentInputTextStyles.SHORT,
    });

    modal.createLabel({
      description: translate('report.modal_details_description'),
      label: translate('report.modal_details'),
    }).createInputText({
      customId: 'content',
      maxLength: Formatter.Commands.Report.MAX_CONTENT_LENGTH,
      required: true,
      style: MessageComponentInputTextStyles.PARAGRAPH,
    });

    return context.respond(modal);
  }
}

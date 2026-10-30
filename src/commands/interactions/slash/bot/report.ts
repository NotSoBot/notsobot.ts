import { Interaction } from 'detritus-client';
import { MessageComponentInputTextStyles, MessageComponentTypes } from 'detritus-client/lib/constants';
import { InteractionModal, InteractionModalArgs, InteractionModalContext } from 'detritus-client/lib/utils';

import { EmbedColors, ReportTypes } from '../../../../constants';
import { Formatter, I18n, Parameters, renderDisplay } from '../../../../utils';

import { createRunErrorPayload, warning } from '../../../errors';
import { BaseInteractionCommand, BaseInteractionCommandOption, translateErrorLabel } from '../../basecommand';


export const COMMAND_NAME = 'report';

const MAX_SERVER_ID_LENGTH = 20;

export async function onModalError(context: Interaction.InteractionContext, modalContext: InteractionModalContext, error: any) {
  const translator = await I18n.getTranslator(context);
  // the context menus and the server `report` use this too, so label it with whichever command the modal came from
  const label = translateErrorLabel((context.command as BaseInteractionCommand).error || 'Slash', translator.translate);
  const title = warning(translator.translate('errors.run_title', {label}));
  const payload = await createRunErrorPayload(context, title, error, translator);
  return modalContext.editOrRespond(await renderDisplay(context, {
    color: EmbedColors.ERROR,
    description: payload.description,
    ephemeral: true,
    fields: payload.fields,
    title: payload.title,
  }));
}

// the user/message context menus already know what's reported, so they only ask for the reason
export async function createReportReasonModal(
  context: Interaction.InteractionContext,
  createArgs: (content: string) => Omit<Formatter.Commands.Report.CommandArgs, 'content'>,
): Promise<InteractionModal> {
  const { translate } = await I18n.getTranslator(context);

  const modal = new InteractionModal({
    title: translate('report.modal_title'),
    run: async (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
      const payload = await Formatter.Commands.Report.createPayload(context, {...createArgs(args.content), content: args.content});
      return modalContext.editOrRespond(await renderDisplay(context, payload));
    },
    onError: (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => {
      return onModalError(context, modalContext, error);
    },
  });

  // reports are for NotSoBot being abused, spamming them gets you blocked
  modal.createTextDisplay({content: `-# ${translate('report.spam_warning')}`});

  modal.createLabel({
    description: translate('report.modal_reason_description'),
    label: translate('report.modal_reason'),
  }).createInputText({
    customId: 'content',
    maxLength: Formatter.Commands.Report.MAX_CONTENT_LENGTH,
    required: true,
    style: MessageComponentInputTextStyles.PARAGRAPH,
  });

  return modal;
}

export class BotReportCommand extends BaseInteractionCommandOption {
  description = 'Send a report to the NotSoBot developers';
  descriptionLocalizations = I18n.localizations('commands.utils.report.description');
  metadata = {
    id: Formatter.Commands.Report.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.utils.report.name');
  // a deferred interaction can't respond with a modal anymore
  respondsWithModal = true;
  // a subcommand without its own inherits the `/bot` group's 1000ms
  triggerLoadingAfter = -1;

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
      onError: (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => {
        return onModalError(context, modalContext, error);
      },
    });

    // reports are for NotSoBot being abused, spamming them gets you blocked (the modal's fifth and last component)
    modal.createTextDisplay({content: `-# ${translate('report.spam_warning')}`});

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

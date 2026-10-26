import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  MessageComponentInputTextStyles,
  MessageComponentTypes,
} from 'detritus-client/lib/constants';
import { InteractionModal, InteractionModalArgs, InteractionModalContext } from 'detritus-client/lib/utils';

import { MAX_GUILD_REPORT_REASON_LENGTH, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply, renderDisplay } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';

import { onModalError } from './bot/report';


export const COMMAND_NAME = 'report';

function addReasonInput(modal: InteractionModal, translate: I18n.Translator['translate']): void {
  modal.createLabel({
    description: translate('report.modal_reason_description'),
    label: translate('report.modal_reason'),
  }).createInputText({
    customId: 'reason',
    maxLength: MAX_GUILD_REPORT_REASON_LENGTH,
    required: true,
    style: MessageComponentInputTextStyles.PARAGRAPH,
  });
}

// the "Report to Mods" context menus already know who or what's reported, so they only ask for the reason
export async function createGuildReportReasonModal(
  context: Interaction.InteractionContext,
  args: Omit<Formatter.Commands.GuildReport.CommandArgs, 'reason'>,
): Promise<InteractionModal> {
  const { translate } = await I18n.getTranslator(context);
  const modal = new InteractionModal({
    title: translate('guild_report.modal_title'),
    run: async (modalContext: InteractionModalContext, modalArgs: InteractionModalArgs) => {
      const payload = await Formatter.Commands.GuildReport.createPayload(context, {...args, reason: modalArgs.reason});
      return modalContext.editOrRespond(await renderDisplay(context, payload));
    },
    onError: (modalContext: InteractionModalContext, modalArgs: InteractionModalArgs, error: any) => {
      return onModalError(context, modalContext, error);
    },
  });
  addReasonInput(modal, translate);
  return modal;
}

// a server without a reports logger can't take reports (and nobody can report themselves), said right away instead of
// after they've written one
export async function replyIfCannotReport(context: Interaction.InteractionContext, targetId?: string): Promise<boolean> {
  if (targetId === context.userId) {
    const { translate } = await I18n.getTranslator(context);
    await displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('report.cannot_report_yourself')}`, ephemeral: true});
    return true;
  }
  const disabled = await Formatter.Commands.GuildReport.getDisabledPayload(context);
  if (disabled) {
    await displayReply(context, disabled);
    return true;
  }
  return false;
}

export default class GuildReportCommand extends BaseSlashCommand {
  description = 'Report a member to this server\'s moderators';
  descriptionLocalizations = I18n.localizations('commands.guild_report.description');
  metadata = {
    id: Formatter.Commands.GuildReport.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.guild_report.name');
  // a deferred interaction can't respond with a modal anymore
  respondsWithModal = true;
  triggerLoadingAfter = -1;

  // the server's own moderators, `bot report` is for the NotSoBot developers
  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  async run(context: Interaction.InteractionContext) {
    if (await replyIfCannotReport(context)) {
      return;
    }
    const { translate } = await I18n.getTranslator(context);

    const modal = new InteractionModal({
      title: translate('guild_report.modal_title'),
      run: async (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
        const userId = (Array.isArray(args.user) && args.user.length) ? args.user[0] : null;
        const payload = await Formatter.Commands.GuildReport.createPayload(context, {
          reason: args.reason,
          user: (userId) ? await Parameters.memberOrUser()(userId, context) : undefined,
        });
        return modalContext.editOrRespond(await renderDisplay(context, payload));
      },
      onError: (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => {
        return onModalError(context, modalContext, error);
      },
    });

    modal.createSelectMenu({
      description: translate('guild_report.modal_user_description'),
      label: translate('guild_report.modal_user'),
    }, {
      customId: 'user',
      maxValues: 1,
      minValues: 1,
      required: true,
      type: MessageComponentTypes.USER_SELECT,
    });
    addReasonInput(modal, translate);

    return context.respond(modal);
  }
}

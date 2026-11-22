import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { ComponentContext } from 'detritus-client/lib/utils';


// a confirm prompt (continue/cancel buttons before a destructive action), each button only acts from the state it expects
//   pending  the buttons are up, nobody answered yet
//   running  continue was pressed and its work is going (presses are only acknowledged)
//   done     it finished (or errored), or was cancelled. Never runs again, presses are only acknowledged
//   expired  nobody answered in time
// pending → running → done, pending → done (cancel), pending → expired (timeout). running → pending only when the
// continue press couldn't even be acknowledged
export type ConfirmerState = 'done' | 'expired' | 'pending' | 'running';


export class Confirmer {
  state: ConfirmerState = 'pending';
  // the command's, a failed continue shows its error on the prompt (`run`)
  context: Command.Context | Interaction.InteractionContext | null;

  constructor(context?: Command.Context | Interaction.InteractionContext) {
    this.context = context || null;
  }

  // only moves when it's in `from`, so a double click or a late timeout can't act twice
  transition(from: ConfirmerState, to: ConfirmerState): boolean {
    if (this.state !== from) {
      return false;
    }
    this.state = to;
    return true;
  }

  // continue: runs `work` once, the press is answered first so slow work doesn't fail the interaction (`work` edits the
  // message through `ctx` afterwards). an error still ends it, the action may have partly happened
  async run(ctx: ComponentContext, work: () => Promise<unknown>): Promise<unknown> {
    if (!this.transition('pending', 'running')) {
      return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    }
    try {
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    } catch(error) {
      // the press couldn't be answered (too late), nothing ran so the buttons still work
      this.transition('running', 'pending');
      throw error;
    }
    try {
      return await work();
    } catch(error) {
      // the error went to sentry only: done, the buttons stayed up for good (presses only acknowledged, the timeout
      // never comes for a done prompt). It replaces them now, still thrown for sentry
      if (this.context) {
        await showConfirmerError(this.context, ctx, error).catch(() => null);
      }
      throw error;
    } finally {
      this.transition('running', 'done');
    }
  }

  // cancel: only before continue was pressed
  async cancel(ctx: ComponentContext, work: () => Promise<unknown>): Promise<unknown> {
    if (!this.transition('pending', 'done')) {
      return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    }
    return work();
  }

  // the timeout: only when nobody answered, it never covers a result
  async expire(work: () => Promise<unknown>): Promise<unknown> {
    if (!this.transition('pending', 'expired')) {
      return;
    }
    return work();
  }
}


async function showConfirmerError(
  context: Command.Context | Interaction.InteractionContext,
  ctx: ComponentContext,
  error: any,
): Promise<void> {
  // required here, both import the utils this file is loaded with
  const { createRunErrorPayload, replyError, warning }: typeof import('../commands/errors') = require('../commands/errors');
  const { getTranslator }: typeof import('./i18n') = require('./i18n');
  const translator = await getTranslator(context);
  const title = warning(translator.translate('errors.prefix_run_title'));
  await replyError(context, await createRunErrorPayload(context, title, error, translator), {replyTo: ctx});
}

import { Interaction, Structures } from 'detritus-client';

import { recordRestRequest } from '../metrics';
import { InteractionExpiredError } from './errors';


// Discord drops an interaction that got no first response within 3 seconds of it being made, the late response comes
// back as a 404 Unknown interaction. How old one is comes from its id's timestamp (discord's clock, ours is ntp synced),
// so it also counts the time it spent waiting on us before any of our code saw it (a stalled event loop)
// No imports from `utils/index` on purpose, the command clients import this directly

const DISCORD_EPOCH = 1420070400000n;
// how the rest metrics name the route (`listeners/metricsinterval.ts`), the responses never sent count under it too
export const INTERACTION_CALLBACK_ROUTE = '/interactions/:interactionId/:token/callback';

export const INTERACTION_RESPONSE_WINDOW = 3000;
// a bit past the window before a response is held back, a clock slightly ahead of discord's never stops one discord
// would've still taken
export const INTERACTION_EXPIRED_AGE = INTERACTION_RESPONSE_WINDOW + 250;
// a command still unanswered this long after it was made is deferred wherever its run is. detritus' own defer
// (`triggerLoadingAfter`) only starts counting once the checks are done (the user, settings and premium fetches, the
// user install's command permissions), which on a busy host already took most of the window
export const INTERACTION_EARLY_DEFER_AGE = 2000;

// the rest metrics' status for a first response held back for being too late
export const EXPIRED_RESPONSE_STATUS = 'expired';


export function getInteractionAge(interactionId: string, now: number = Date.now()): number {
  try {
    return Math.max(now - Number((BigInt(interactionId) >> 22n) + DISCORD_EPOCH), 0);
  } catch(error) {
    return 0;
  }
}

export function isInteractionExpired(interactionId: string, now: number = Date.now()): boolean {
  return INTERACTION_EXPIRED_AGE <= getInteractionAge(interactionId, now);
}

// a response that wasn't sent for being too late, counted next to the 404s it would've been
export function recordExpiredResponse(): void {
  recordRestRequest('POST', INTERACTION_CALLBACK_ROUTE, EXPIRED_RESPONSE_STATUS);
}


// the unwrapped `createResponse`, kept on the prototype so a `.refresh` wraps the original again instead of its wrapper
const ORIGINAL_CREATE_RESPONSE = Symbol.for('notsobot.interaction.createResponse');

// every first response goes through `Interaction.createResponse` (slash commands, autocompletes, buttons, modals, the
// deferrals), one that's already too late throws `InteractionExpiredError` instead of making the request. an error
// handler answering a failed reply used to try the same late first response again, two 404s for one command
export function guardInteractionResponses(): void {
  const prototype = Structures.Interaction.prototype as any;
  const original = prototype[ORIGINAL_CREATE_RESPONSE] || prototype.createResponse;
  prototype[ORIGINAL_CREATE_RESPONSE] = original;
  prototype.createResponse = async function(this: Structures.Interaction, options: any, data?: any) {
    // the same wait as the original's, a response already on its way decides whether this is a first one
    while (this._responding) {
      await this._responding;
    }
    if (!this.responded) {
      const age = getInteractionAge(this.id);
      if (INTERACTION_EXPIRED_AGE <= age) {
        recordExpiredResponse();
        throw new InteractionExpiredError(age);
      }
    }
    return original.call(this, options, data);
  };
}


// defers `context` with `defer` once it's `INTERACTION_EARLY_DEFER_AGE` old, unless something responded first. gives
// the function that cancels it
export function startEarlyDefer(
  context: Interaction.InteractionContext,
  defer: () => Promise<unknown> | unknown,
): () => void {
  let stopped = false;
  const delay = Math.max(INTERACTION_EARLY_DEFER_AGE - getInteractionAge(context.interactionId), 0);
  const timeout = setTimeout(async () => {
    while (context._responding) {
      await context._responding;
    }
    if (stopped || context.responded) {
      return;
    }
    try {
      await Promise.resolve(defer());
    } catch(error) {
      // too late after all (`InteractionExpiredError`), or another response won the race, the run's own reply says
      // what happened
    }
  }, delay);
  return () => {
    stopped = true;
    clearTimeout(timeout);
  };
}

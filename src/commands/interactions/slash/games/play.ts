import { Interaction } from 'detritus-client';

import { CommandRatelimits } from '../../../../constants';
import { I18n } from '../../../../utils';
import { launchEditor, refuseCommandLaunch } from '../../../../utils/editoractivity';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_ID = 'games';


// /games play: the media editor's activity opened on its game rooms, played together in the activity. the in-chat games
// are its siblings. Launched like `/editor`, the activity reads which one from the launch the bot stores. The id stays
// `games` from when this was the top-level `/games`
export class GamesPlayCommand extends BaseInteractionCommandOption {
  description = 'Play games together in the NotSoBot Activity';
  descriptionLocalizations = I18n.localizations('commands.games.play.description');
  metadata = {
    id: COMMAND_ID,
  };
  name = 'play';

  // the launch has to be the interaction's first answer, nothing defers it (`answersItselfFirst`), so the channel checks
  // a defer would have done are made in `run`. both are the subcommand's own: detritus' loading trigger, the early defer
  // and `onBefore` all go by the invoker, and an option's own -1 isn't replaced by the group's 1000
  launchesActivity = true;
  triggerLoadingAfter = -1;

  constructor() {
    // the launch commands' own bucket (`/editor`'s too)
    super({ratelimits: CommandRatelimits.ACTIVITY});
  }

  async run(context: Interaction.InteractionContext) {
    // the gate: who it's open to, an App Channel bound to NotSoBot (the activity is open inline, its Games tab is right
    // there), the decoy channel and a channel the server turned NotSoBot off in (an activity would post that it started)
    if (await refuseCommandLaunch(context, 'games')) {
      return;
    }
    await launchEditor(context, {surface: 'games'});
  }
}

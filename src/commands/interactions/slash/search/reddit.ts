import { Interaction } from 'detritus-client';

import { RedditSortTypes, RedditTimeTypes } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'reddit';

export class SearchRedditCommand extends BaseInteractionCommandOption {
  description = 'Search Reddit';
  descriptionLocalizations = I18n.localizations('commands.search.reddit.description');
  metadata = {
    id: Formatter.Commands.SearchReddit.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.search.reddit.name');

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', ...I18n.optionLocalizations('commands.search.reddit.query'), required: true},
        {name: 'subreddit', description: 'Subreddit to search in', ...I18n.optionLocalizations('commands.search.reddit.subreddit')},
        {name: 'sort', description: 'Sort By', ...I18n.optionLocalizations('commands.search.reddit.sort'), choices: Parameters.Slash.oneOf({choices: RedditSortTypes, localizationKey: 'choices.reddit_sort_types'})},
        {name: 'time', description: 'Time Range', ...I18n.optionLocalizations('commands.search.reddit.time'), choices: Parameters.Slash.oneOf({choices: RedditTimeTypes, doNotSort: true, localizationKey: 'choices.reddit_time_types'})},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchReddit.CommandArgs) {
    return Formatter.Commands.SearchReddit.createMessage(context, args);
  }
}

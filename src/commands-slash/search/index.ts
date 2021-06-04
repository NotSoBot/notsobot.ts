import { BaseCommand } from '../basecommand';

import { SearchGoogleGroupCommand } from './google';
import { SearchSteamGroupCommand } from './steam';


export default class SearchGroupCommand extends BaseCommand {
  description = '.';
  name = 'search';

  constructor() {
    super({
      options: [
        new SearchGoogleGroupCommand(),
        new SearchSteamGroupCommand(),
      ],
    });
  }
}

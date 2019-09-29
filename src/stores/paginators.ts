import { Collections } from 'detritus-client';

import { Paginator } from '../utils';


// Stores paginators based on channnel id
class PaginatorsStore extends Collections.BaseCollection<string, Paginator> {
  insert(paginator: Paginator): void {
    this.set(paginator.context.channelId, paginator);
  }
}

export default new PaginatorsStore();

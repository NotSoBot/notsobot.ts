import { Paginator } from '../utils/paginator';
import { Store } from './store';
declare class PaginatorsStore extends Store<string, Paginator> {
    insert(paginator: Paginator): void;
    create(): void;
}
declare const _default: PaginatorsStore;
export default _default;

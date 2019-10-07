import { Structures } from 'detritus-client';
import { Store } from './store';
export declare type MemberOrUser = Structures.Member | Structures.User | null;
declare class MemberOrUserStore extends Store<string, MemberOrUser> {
    constructor();
    insert(key: string, payload: MemberOrUser): void;
}
declare const _default: MemberOrUserStore;
export default _default;

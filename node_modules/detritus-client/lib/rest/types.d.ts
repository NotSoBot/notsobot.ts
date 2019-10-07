import { BaseCollection } from '../collections/basecollection';
import { User } from '../structures';
export declare namespace RestResponses {
    interface FetchGuildBans extends BaseCollection<string, RawGuildBan> {
    }
    interface RawGuildBan {
        reason: null | string;
        user: User;
    }
}

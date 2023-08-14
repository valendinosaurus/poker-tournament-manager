import { Entry } from '../../shared/models/entry.interface';
import { Finish } from '../../shared/models/finish.interface';

export interface CombinedEntriesFinishes {
    entries: Entry[],
    finish: Finish[]
}

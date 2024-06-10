import { Entry } from '../../shared/interfaces/entry.interface';
import { Finish } from '../../shared/interfaces/finish.interface';

export interface CombinedEntriesFinishes {
    entries: Entry[],
    finish: Finish[]
}

import { Branding } from './branding.interface';
import { Tournament } from './tournament.interface';

export interface SeriesDetails {
    id: number | undefined;
    name: string;
    shortDesc: string;
    longDesc: string;
    branding: Branding;
    tournaments: Tournament[];
    finalTournament: Tournament;
    rankFormula: number;
    ftFormula: number;
}

import { MathContent } from '../../shared/models/math-content.interface';

export interface SeriesHeader {
    logo: string;
    name: string;
    tournamentsPlayed: number;
    totalTournaments: number;
    percentageToFinalPot: number;
    maxAmountPerTournament: number;
    guaranteed: number;
    formulaMathContent: MathContent;
    formulaImageUrl: string | undefined;
}

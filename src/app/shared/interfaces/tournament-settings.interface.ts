export interface TournamentSettings {
    id: number;
    autoSlide: boolean;
    showCondensedBlinds: boolean;
    started: Date | undefined;
    levelIndex: number;
    timeLeft: number;
}

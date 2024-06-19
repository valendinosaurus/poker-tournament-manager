import { SimpleStat } from '../../shared/interfaces/simple-stat.interface';

export const DEFAULT_DIALOG_POSITION = {
    position: {
        top: '10vh'
    },
    maxHeight: '86vh',
    width: window.innerWidth <= 800 ? '95%' : undefined,
    maxWidth: window.innerWidth <= 800 ? '95vw' : '80vw'
};

export const TIMER_DIALOG_PANEL_CLASS = {
    panelClass: 'timer-dialog'
};

export const mostSpilled: SimpleStat[] = [
    {
        image: 'https://c8.alamy.com/compde/gc2ebk/ufo-verteiler-lkw-weissbier-in-boston-street-gc2ebk.jpg',
        played: 4,
        value: 3,
        playerName: 'Leon',
        inactive: false
    },
    {
        image: 'https://c8.alamy.com/compde/gc2ebk/ufo-verteiler-lkw-weissbier-in-boston-street-gc2ebk.jpg',
        played: 4,
        value: 3,
        playerName: 'Maki',
        inactive: false
    },
    {
        image: 'https://media.wired.com/photos/5af36b4a65806b269bfe8e44/master/w_2560%2Cc_limit/marijuana-522464999.jpg',
        played: 5,
        value: 3,
        playerName: 'Päscu',
        inactive: false
    },
    {
        image: 'https://wallpapers.com/images/high/spongebob-funny-pictures-5nvei6lzsokn0rek.webp',
        played: 6,
        value: 2,
        playerName: 'Ali',
        inactive: false
    },
    {
        image: 'https://media.wired.com/photos/5af36b4a65806b269bfe8e44/master/w_2560%2Cc_limit/marijuana-522464999.jpg',
        played: 6,
        value: 1,
        playerName: 'Valentino',
        inactive: false
    },
];


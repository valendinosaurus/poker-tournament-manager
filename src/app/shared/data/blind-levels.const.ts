import {BlindLevel} from '../models/blind-level.interface';
import {Pause} from '../models/pause.interface';

export const blindLevelsNoAnte: (BlindLevel | Pause)[] = [
    {
        sb: 25,
        bb: 50,
        ante: 0,
        durationMinutes: 0.1,
    },
    {
        sb: 50,
        bb: 100,
        ante: 0,
        durationMinutes: 0.1,
    },
    // {
    //     sb: 75,
    //     bb: 150,
    //     ante: 0,
    //     durationMinutes: 20,
    // },
    {
        sb: 100,
        bb: 200,
        ante: 0,
        durationMinutes: 0.1,
    },
    {
        durationMinutes: 5,
        type: 'chip-up'
    },
    {
        sb: 200,
        bb: 400,
        ante: 0,
        durationMinutes: 20,
    },
    {
        sb: 300,
        bb: 600,
        ante: 0,
        durationMinutes: 20,
    },
    // {
    //     sb: 400,
    //     bb: 800,
    //     ante: 0,
    //     durationMinutes: 20,
    // },
    {
        sb: 500,
        bb: 1000,
        ante: 0,
        durationMinutes: 20,
    },
    {
        durationMinutes: 5,
        type: 'regular'
    },
    {
        sb: 700,
        bb: 1400,
        ante: 0,
        durationMinutes: 20,
    },
    {
        sb: 1000,
        bb: 2000,
        ante: 0,
        durationMinutes: 20,
    },
    {
        sb: 1300,
        bb: 2600,
        ante: 0,
        durationMinutes: 20,
    },
    {
        sb: 1600,
        bb: 3200,
        ante: 0,
        durationMinutes: 20,
    },
    {
        durationMinutes: 5,
        type: 'chip-up'
    },
    {
        sb: 2000,
        bb: 4000,
        ante: 0,
        durationMinutes: 20,
    },
    {
        sb: 3000,
        bb: 6000,
        ante: 0,
        durationMinutes: 20,
    },
    {
        sb: 4000,
        bb: 8000,
        ante: 0,
        durationMinutes: 20,
    },
    {
        sb: 5000,
        bb: 10000,
        ante: 0,
        durationMinutes: 20,
    },
];

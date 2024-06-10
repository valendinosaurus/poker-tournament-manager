import { BlindLevel } from './blind-level.interface';

export interface BlindStructure {
    id: number;
    name: string;
    sub: string;
    structure: BlindLevel[];
    locked: boolean;
}

export interface BlindStructureModel extends Omit<BlindStructure, 'id'> {
    id: number | undefined;
}


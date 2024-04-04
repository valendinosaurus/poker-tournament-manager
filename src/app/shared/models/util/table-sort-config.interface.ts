export interface TableSortConfig {
    property: string;
    direction: 'ASC' | 'DESC';
}

export interface BlindLevelTableSortConfig extends TableSortConfig {
    filterType: 'ALL' | 'REGULAR' | 'PAUSE';
    duration: number;
}

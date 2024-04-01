export interface Location {
    id: number;
    name: string;
    image: string;
}

export interface LocationModel extends Omit<Location, 'id'>{
    id: number | undefined;
}

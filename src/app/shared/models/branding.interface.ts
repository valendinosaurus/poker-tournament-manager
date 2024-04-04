export interface Branding {
    id: number;
    name: string;
    description: string;
    logo: string;
    locked: boolean;
}

export interface BrandingModel extends Omit<Branding, 'id'> {
    id: number | undefined;
}

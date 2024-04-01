export interface Branding {
    id: number;
    name: string;
    description: string;
    logo: string;
}

export interface BrandingModel extends Omit<Branding, 'id'> {
    id: number | undefined;
}

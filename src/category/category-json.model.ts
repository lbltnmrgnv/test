export interface JsonCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    active: boolean;
    createdDate: string; // ISO-строка
}
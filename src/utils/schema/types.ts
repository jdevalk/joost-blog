export type SchemaPageType =
    | 'blogPost'
    | 'video'
    | 'homepage'
    | 'about'
    | 'blogListing'
    | 'category'
    | 'videoListing'
    | 'page';

export interface SchemaPageContext {
    pageType: SchemaPageType;
    canonicalUrl: string;
    title: string;
    description: string;
    publishDate?: Date;
    updatedDate?: Date;
    featureImageUrl?: string;
    categories?: string[];
    categoryName?: string;
    youtubeId?: string;
    duration?: string;
    wordCount?: number;
}

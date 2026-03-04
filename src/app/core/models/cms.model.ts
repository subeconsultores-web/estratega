export interface LandingConfig {
    id?: string;
    heroTitle: { es: string; en: string; pt: string };
    heroSubtitle: { es: string; en: string; pt: string };
    aboutTitle: { es: string; en: string; pt: string };
    aboutDescription: { es: string; en: string; pt: string };
    missionText: { es: string; en: string; pt: string };
    visionText: { es: string; en: string; pt: string };
    updatedAt?: any; // Firestore Timestamp
}

export interface TeamMember {
    id?: string;
    name: string;
    role: { es: string; en: string; pt: string };
    description: { es: string; en: string; pt: string };
    imageUrl: string;
    linkedinUrl: string;
    order: number;
    isActive: boolean;
}

export interface BlogPost {
    id?: string;
    slug: string;
    title: { es: string; en: string; pt: string };
    content: { es: string; en: string; pt: string }; // Can be HTML or Markdown
    excerpt: { es: string; en: string; pt: string };
    imageUrl: string;
    authorId: string;
    authorName: string;
    publishedAt: any; // Firestore Timestamp
    status: 'draft' | 'published' | 'archived';
    tags: string[];
}

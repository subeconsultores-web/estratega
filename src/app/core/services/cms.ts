import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, collectionData, docData, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { LandingConfig, TeamMember, BlogPost } from '../models/cms.model';

@Injectable({
  providedIn: 'root'
})
export class CmsService {
  private firestore = inject(Firestore);

  // --- LANDING CONFIG ---
  getLandingConfig(): Observable<LandingConfig | undefined> {
    const configDoc = doc(this.firestore, 'landing_config', 'main_es');
    return docData(configDoc, { idField: 'id' }) as Observable<LandingConfig | undefined>;
  }

  async saveLandingConfig(config: Partial<LandingConfig>): Promise<void> {
    const configDoc = doc(this.firestore, 'landing_config', 'main_es');
    await setDoc(configDoc, { ...config, updatedAt: serverTimestamp() }, { merge: true });
  }

  // --- TEAM MEMBERS ---
  getTeamMembers(activeOnly = false): Observable<TeamMember[]> {
    const teamCol = collection(this.firestore, 'team_members');
    const q = activeOnly
      ? query(teamCol, where('isActive', '==', true), orderBy('order', 'asc'))
      : query(teamCol, orderBy('order', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<TeamMember[]>;
  }

  async addTeamMember(member: TeamMember): Promise<string> {
    const teamCol = collection(this.firestore, 'team_members');
    const docRef = await addDoc(teamCol, member);
    return docRef.id;
  }

  async updateTeamMember(id: string, member: Partial<TeamMember>): Promise<void> {
    const memberDoc = doc(this.firestore, `team_members/${id}`);
    await updateDoc(memberDoc, member);
  }

  async deleteTeamMember(id: string): Promise<void> {
    const memberDoc = doc(this.firestore, `team_members/${id}`);
    await deleteDoc(memberDoc);
  }

  // --- BLOG POSTS ---
  getBlogPosts(publishedOnly = false): Observable<BlogPost[]> {
    const blogCol = collection(this.firestore, 'blog_posts');
    const q = publishedOnly
      ? query(blogCol, where('status', '==', 'published'), orderBy('publishedAt', 'desc'))
      : query(blogCol, orderBy('publishedAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<BlogPost[]>;
  }

  getBlogPostBySlug(slug: string): Observable<BlogPost[]> {
    const blogCol = collection(this.firestore, 'blog_posts');
    const q = query(blogCol, where('slug', '==', slug));
    return collectionData(q, { idField: 'id' }) as Observable<BlogPost[]>;
  }

  async addBlogPost(post: BlogPost): Promise<string> {
    const blogCol = collection(this.firestore, 'blog_posts');
    const docRef = await addDoc(blogCol, { ...post, publishedAt: serverTimestamp() });
    return docRef.id;
  }

  async updateBlogPost(id: string, post: Partial<BlogPost>): Promise<void> {
    const postDoc = doc(this.firestore, `blog_posts/${id}`);
    await updateDoc(postDoc, post);
  }

  async deleteBlogPost(id: string): Promise<void> {
    const postDoc = doc(this.firestore, `blog_posts/${id}`);
    await deleteDoc(postDoc);
  }
}

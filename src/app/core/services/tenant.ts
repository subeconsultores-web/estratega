import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, shareReplay, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Tenant } from '../models/tenant.model';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  tenant$: Observable<Tenant | null> = this.authService.tenantId$.pipe(
    switchMap(tenantId => {
      if (!tenantId) return of(null);
      const tenantRef = doc(this.firestore, `tenants/${tenantId}`);
      return docData(tenantRef, { idField: 'id' }) as Observable<Tenant>;
    }),
    shareReplay(1)
  );

  config$: Observable<Tenant['config'] | null> = this.tenant$.pipe(
    map(tenant => tenant?.config || null),
    shareReplay(1)
  );

  /**
   * Applies tenant config (CSS variables for colors) globally.
   * Can be called from an app initializer or the layout component.
   */
  applyTenantConfig(config: Tenant['config']) {
    if (!config) return;

    // Apply Primary Color
    if (config.colorPrimario) {
      this.setCssVariable('--primary', this.hexToHsl(config.colorPrimario));
    }

    // Apply Secondary Color
    if (config.colorSecundario) {
      this.setCssVariable('--secondary', this.hexToHsl(config.colorSecundario));
    }
  }

  /**
   * Updates the current tenant's configuration in Firestore.
   */
  async updateConfig(newConfig: Partial<Tenant['config']>) {
    const tenantId = await this.authService.getTenantId();
    if (!tenantId) throw new Error('No tenant ID found');

    // We update only the config fields provided
    const tenantRef = doc(this.firestore, `tenants/${tenantId}`);

    // We use dot notation to update nested config fields to avoid overwriting the whole config object
    const updateData: any = {};
    Object.entries(newConfig).forEach(([key, value]) => {
      updateData[`config.${key}`] = value;
    });

    await import('@angular/fire/firestore').then(m => m.updateDoc(tenantRef, updateData));
  }

  private setCssVariable(name: string, value: string) {
    document.documentElement.style.setProperty(name, value);
  }

  private hexToHsl(hex: string): string {
    // Basic hex to HSL converter tailored for Tailwind HSL variables (e.g. "210 100% 50%")
    // Remove hash
    hex = hex.replace(/^#/, '');

    // Parse r, g, b values
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    // Return in Format: H S% L%
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }
}

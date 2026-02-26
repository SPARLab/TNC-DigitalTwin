export interface INaturalistTaxonStatus {
  threatened: boolean;
  coordinatesMayBeObscured: boolean;
  statusCode: string | null;
  badgeCode: 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD' | 'NE' | null;
  statusLabel: string | null;
  authority: string | null;
}

interface RawConservationStatus {
  status?: string | null;
  status_name?: string | null;
  geoprivacy?: string | null;
  authority?: string | null;
  place?: { id?: number | null; display_name?: string | null; name?: string | null } | null;
}

class INaturalistTaxonStatusService {
  private readonly baseUrl = 'https://api.inaturalist.org/v1';
  private readonly cache = new Map<number, Promise<INaturalistTaxonStatus | null>>();
  // Preserve data is California-centric; place-scoped status better matches user-facing iNat badges.
  private readonly preferredPlaceId = 14;

  getTaxonStatus(taxonId: number): Promise<INaturalistTaxonStatus | null> {
    if (!Number.isFinite(taxonId) || taxonId <= 0) {
      return Promise.resolve(null);
    }

    const cached = this.cache.get(taxonId);
    if (cached) return cached;

    const request = this.fetchTaxonStatus(taxonId);
    this.cache.set(taxonId, request);
    return request;
  }

  private async fetchTaxonStatus(taxonId: number): Promise<INaturalistTaxonStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/taxa/${taxonId}?place_id=${this.preferredPlaceId}`);
      if (!response.ok) {
        return null;
      }

      const payload = await response.json() as {
        results?: Array<{
          threatened?: boolean | null;
          conservation_status?: RawConservationStatus | null;
          conservation_statuses?: RawConservationStatus[] | null;
        }>;
      };
      const result = payload.results?.[0];
      if (!result) return null;

      const allStatuses: RawConservationStatus[] = [];
      if (result.conservation_status) allStatuses.push(result.conservation_status);
      if (Array.isArray(result.conservation_statuses)) {
        allStatuses.push(...result.conservation_statuses);
      }

      const coordinatesMayBeObscured = allStatuses.some((status) => {
        const geoprivacy = (status.geoprivacy || '').toString().trim().toLowerCase();
        return geoprivacy === 'obscured' || geoprivacy === 'private';
      });
      const evaluated = allStatuses
        .map((status) => {
          const rawCode = (status.status || '').toString().trim();
          const rawName = (status.status_name || '').toString().trim();
          const authority = (status.authority || '').toString().trim() || null;
          const placeLabel = status.place?.display_name || status.place?.name || null;
          const normalized = this.normalizeForMatch(rawCode || rawName);
          const badgeCode = this.mapToBadgeCode(normalized);
          return {
            rawCode,
            rawName,
            authority,
            placeLabel,
            badgeCode,
            severity: this.getSeverity(badgeCode),
          };
        })
        .sort((a, b) => b.severity - a.severity);

      const best = evaluated[0] || null;
      const threatened = result.threatened === true || (best ? best.severity >= 3 : false);

      const statusLabel = best
        ? `${best.rawCode || best.rawName}${best.placeLabel ? ` (${best.placeLabel})` : ''}`
        : null;

      return {
        threatened,
        coordinatesMayBeObscured,
        statusCode: best?.rawCode?.toUpperCase() || null,
        badgeCode: best?.badgeCode || null,
        statusLabel,
        authority: best?.authority || null,
      };
    } catch {
      return null;
    }
  }

  private normalizeForMatch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  }

  private mapToBadgeCode(normalized: string): INaturalistTaxonStatus['badgeCode'] {
    if (!normalized) return null;
    if (normalized === 'CR') return 'CR';
    if (normalized === 'EN') return 'EN';
    if (normalized === 'VU') return 'VU';
    if (normalized === 'NT') return 'NT';
    if (normalized === 'LC') return 'LC';
    if (normalized === 'DD') return 'DD';
    if (normalized === 'NE') return 'NE';

    if (/(CRITICALLY\s*ENDANGERED|ENDANGERED|EN\s+PELIGRO|EN\s*PELIGRO)/.test(normalized)) {
      return 'EN';
    }
    if (/VULNERABLE|THREATENED/.test(normalized)) {
      return 'VU';
    }
    if (/NEAR\s*THREATENED|IMPERILED|AT\s*RISK/.test(normalized)) {
      return 'NT';
    }
    if (/LEAST\s*CONCERN/.test(normalized)) {
      return 'LC';
    }

    // NatureServe-style ranks: S1/S2/N1/N2/G1/G2 -> EN, S3/N3/G3 -> VU.
    if (/\b[NSG]?([12])\b/.test(normalized) || /[NSG][12]/.test(normalized)) return 'EN';
    if (/\b[NSG]?3\b/.test(normalized) || /[NSG]3/.test(normalized)) return 'VU';

    return null;
  }

  private getSeverity(code: INaturalistTaxonStatus['badgeCode']): number {
    switch (code) {
      case 'CR': return 6;
      case 'EN': return 5;
      case 'VU': return 4;
      case 'NT': return 3;
      case 'LC': return 2;
      case 'DD': return 1;
      case 'NE': return 0;
      default: return 0;
    }
  }
}

export const inaturalistTaxonStatusService = new INaturalistTaxonStatusService();

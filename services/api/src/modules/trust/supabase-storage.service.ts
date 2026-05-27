import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  CreateMediaUploadIntentInput,
  MediaUploadIntent,
} from './trust.types';

@Injectable()
export class SupabaseStorageService {
  private readonly supabaseUrl = process.env.SUPABASE_URL;
  private readonly serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  private readonly bucket =
    process.env.SUPABASE_WORK_PROOF_BUCKET ?? 'ekotrust-work-proofs';
  private readonly expiresInSeconds = Number(
    process.env.SUPABASE_UPLOAD_URL_EXPIRES_SECONDS ?? 900,
  );

  getBucketName() {
    return this.bucket;
  }

  buildStorageKey(input: CreateMediaUploadIntentInput): string {
    const cleanFileName = input.fileName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const extension = cleanFileName.includes('.')
      ? cleanFileName.substring(cleanFileName.lastIndexOf('.'))
      : input.mediaType === 'video'
        ? '.mp4'
        : '.jpg';
    return [
      'work-proofs',
      input.proofId,
      input.mediaRole,
      `${Date.now()}-${input.contentHash.slice(0, 16)}${extension}`,
    ].join('/');
  }

  async createSignedUploadIntent(
    input: CreateMediaUploadIntentInput,
    storageKey: string,
  ): Promise<MediaUploadIntent> {
    if (!this.supabaseUrl || !this.serviceRoleKey) {
      throw new ServiceUnavailableException(
        'Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    const encodedPath = storageKey
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    const endpoint = `${this.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/upload/sign/${this.bucket}/${encodedPath}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: this.serviceRoleKey,
        authorization: `Bearer ${this.serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: this.expiresInSeconds, upsert: false }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Supabase signed upload URL failed with ${response.status}`,
      );
    }

    const payload = (await response.json()) as {
      url?: string;
      signedUrl?: string;
      token?: string;
    };
    const uploadUrl = payload.signedUrl ?? payload.url;
    if (!uploadUrl) {
      throw new ServiceUnavailableException(
        'Supabase signed upload URL response was missing a URL.',
      );
    }

    return {
      provider: 'supabase',
      bucket: this.bucket,
      storageKey,
      uploadUrl: uploadUrl.startsWith('http')
        ? uploadUrl
        : `${this.supabaseUrl.replace(/\/$/, '')}${uploadUrl}`,
      token: payload.token,
      headers: {
        'content-type': input.contentType,
      },
      expiresInSeconds: this.expiresInSeconds,
    };
  }
}

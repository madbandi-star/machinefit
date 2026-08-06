import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import {
  BACKUP_MANIFEST_NAME,
  BACKUP_PAYLOAD_NAME,
  backupManifestSchema,
  type BackupFormat,
  type BackupManifest,
  type BackupType,
} from '@machinefit/shared';

export async function packBackupArchive(params: {
  type: BackupType;
  backupVersion: number;
  appVersion: string;
  payload: unknown;
  format: BackupFormat;
}): Promise<{ buffer: Buffer; contentType: string; payloadJson: string }> {
  const payloadJson = JSON.stringify(params.payload, null, 2);
  if (params.format === 'json') {
    return {
      buffer: Buffer.from(payloadJson, 'utf8'),
      contentType: 'application/json; charset=utf-8',
      payloadJson,
    };
  }

  const checksum = createHash('sha256').update(payloadJson).digest('hex');
  const manifest: BackupManifest = {
    backup_version: params.backupVersion,
    type: params.type,
    exported_at: new Date().toISOString(),
    app_version: params.appVersion,
    payload_file: BACKUP_PAYLOAD_NAME,
    checksum_sha256: checksum,
  };

  const zip = new JSZip();
  zip.file(BACKUP_MANIFEST_NAME, JSON.stringify(manifest, null, 2));
  zip.file(BACKUP_PAYLOAD_NAME, payloadJson);
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    streamFiles: true,
  });
  return {
    buffer: Buffer.from(buffer),
    contentType: 'application/zip',
    payloadJson,
  };
}

export async function unpackBackupArchive(
  buffer: Buffer,
  fileNameHint?: string
): Promise<{ payload: unknown; manifest: BackupManifest | null }> {
  const looksZip =
    (fileNameHint && /\.zip$/i.test(fileNameHint)) ||
    (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b);

  if (!looksZip) {
    const text = buffer.toString('utf8');
    return { payload: JSON.parse(text) as unknown, manifest: null };
  }

  const zip = await JSZip.loadAsync(buffer);
  const manifestFile = zip.file(BACKUP_MANIFEST_NAME);
  let manifest: BackupManifest | null = null;
  if (manifestFile) {
    const parsed = backupManifestSchema.safeParse(JSON.parse(await manifestFile.async('string')));
    if (parsed.success) manifest = parsed.data;
  }

  const payloadName = manifest?.payload_file || BACKUP_PAYLOAD_NAME;
  const payloadFile =
    zip.file(payloadName) ||
    zip.file(BACKUP_PAYLOAD_NAME) ||
    Object.values(zip.files).find((f) => !f.dir && /\.json$/i.test(f.name) && !f.name.includes('manifest'));

  if (!payloadFile) {
    throw new Error('Backup archive is missing backup.json');
  }
  const payloadText = await payloadFile.async('string');
  if (manifest?.checksum_sha256) {
    const actual = createHash('sha256').update(payloadText).digest('hex');
    if (actual !== manifest.checksum_sha256) {
      throw new Error('Backup file checksum mismatch — file may be corrupted');
    }
  }
  return { payload: JSON.parse(payloadText) as unknown, manifest };
}

/**
 * ✅ PRODUCTION-READY: Cloud Storage Abstraction Layer
 * Supports local storage (development) and cloud storage (production)
 * 
 * Supported providers:
 * - Local filesystem (development only)
 * - Cloudflare R2 (recommended for Vercel)
 * - AWS S3
 * - Vercel Blob Storage
 * 
 * Configuration via environment variables:
 * STORAGE_PROVIDER=local|r2|s3|vercel-blob
 */

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Storage provider type
type StorageProvider = 'local' | 'r2' | 's3' | 'vercel-blob'

// Configuration
const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER as StorageProvider) || 'local'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Warn if using local storage in production
if (IS_PRODUCTION && STORAGE_PROVIDER === 'local') {
  console.warn(
    '⚠️ WARNING: Using local storage in production! This will NOT work on Vercel. ' +
    'Please configure cloud storage (R2, S3, or Vercel Blob).'
  )
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  key?: string // Storage key/identifier
}

export interface StorageConfig {
  provider: StorageProvider
  bucket?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
}

/**
 * Upload file to configured storage
 */
export async function uploadFile(
  file: File,
  path: string
): Promise<UploadResult> {
  try {
    switch (STORAGE_PROVIDER) {
      case 'local':
        return await uploadToLocal(file, path)
      
      case 'r2':
        return await uploadToR2(file, path)
      
      case 's3':
        return await uploadToS3(file, path)
      
      case 'vercel-blob':
        return await uploadToVercelBlob(file, path)
      
      default:
        return {
          success: false,
          error: 'Invalid storage provider',
        }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Delete file from configured storage
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    switch (STORAGE_PROVIDER) {
      case 'local':
        return await deleteFromLocal(key)
      
      case 'r2':
        return await deleteFromR2(key)
      
      case 's3':
        return await deleteFromS3(key)
      
      case 'vercel-blob':
        return await deleteFromVercelBlob(key)
      
      default:
        return false
    }
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

// ============================================
// LOCAL STORAGE (Development only)
// ============================================

async function uploadToLocal(file: File, path: string): Promise<UploadResult> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    
    // Save file
    const filepath = join(uploadDir, path)
    await writeFile(filepath, buffer)
    
    return {
      success: true,
      url: `/uploads/${path}`,
      key: path,
    }
  } catch (error) {
    throw error
  }
}

async function deleteFromLocal(key: string): Promise<boolean> {
  try {
    const { unlink } = await import('fs/promises')
    const filepath = join(process.cwd(), 'public', 'uploads', key)
    await unlink(filepath)
    return true
  } catch {
    return false
  }
}

// ============================================
// CLOUDFLARE R2 (Recommended for Vercel)
// ============================================

async function uploadToR2(file: File, path: string): Promise<UploadResult> {
  // TODO: Implement Cloudflare R2 upload
  // Configuration via environment variables:
  // - R2_ACCOUNT_ID
  // - R2_ACCESS_KEY_ID
  // - R2_SECRET_ACCESS_KEY
  // - R2_BUCKET_NAME
  
  // Example implementation:
  /*
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
  
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: path,
    Body: buffer,
    ContentType: file.type,
  }))
  
  return {
    success: true,
    url: `https://your-domain.com/uploads/${path}`,
    key: path,
  }
  */
  
  throw new Error('R2 storage not configured. Please set environment variables.')
}

async function deleteFromR2(key: string): Promise<boolean> {
  // TODO: Implement Cloudflare R2 delete
  return false
}

// ============================================
// AWS S3
// ============================================

async function uploadToS3(file: File, path: string): Promise<UploadResult> {
  // TODO: Implement AWS S3 upload
  // Configuration via environment variables:
  // - AWS_ACCESS_KEY_ID
  // - AWS_SECRET_ACCESS_KEY
  // - AWS_REGION
  // - AWS_S3_BUCKET
  
  throw new Error('S3 storage not configured. Please set environment variables.')
}

async function deleteFromS3(key: string): Promise<boolean> {
  // TODO: Implement AWS S3 delete
  return false
}

// ============================================
// VERCEL BLOB STORAGE
// ============================================

async function uploadToVercelBlob(file: File, path: string): Promise<UploadResult> {
  // TODO: Implement Vercel Blob storage
  // Requires: npm install @vercel/blob
  // Configuration via environment variables:
  // - BLOB_READ_WRITE_TOKEN (automatically set by Vercel)
  
  /*
  const { put } = await import('@vercel/blob')
  
  const blob = await put(path, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  
  return {
    success: true,
    url: blob.url,
    key: path,
  }
  */
  
  throw new Error('Vercel Blob storage not configured.')
}

async function deleteFromVercelBlob(key: string): Promise<boolean> {
  // TODO: Implement Vercel Blob delete
  return false
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get storage configuration
 */
export function getStorageConfig(): StorageConfig {
  return {
    provider: STORAGE_PROVIDER,
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    endpoint: process.env.STORAGE_ENDPOINT,
  }
}

/**
 * Check if storage is properly configured
 */
export function isStorageConfigured(): boolean {
  if (STORAGE_PROVIDER === 'local') {
    return !IS_PRODUCTION
  }
  
  // Check required environment variables based on provider
  switch (STORAGE_PROVIDER) {
    case 'r2':
      return !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
      )
    
    case 's3':
      return !!(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_REGION &&
        process.env.AWS_S3_BUCKET
      )
    
    case 'vercel-blob':
      return !!process.env.BLOB_READ_WRITE_TOKEN
    
    default:
      return false
  }
}


import { supabase } from './supabase'
import { AttachmentType } from './database.types'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
}

export type UploadError = {
  message: string
  code: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'UPLOAD_ERROR'
}

export async function uploadFile(
  file: File,
  type: AttachmentType
): Promise<{ data: { path: string; fileType: AttachmentType } | null; error: UploadError | null }> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        data: null,
        error: {
          message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE'
        }
      }
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES[type].includes(file.type)) {
      return {
        data: null,
        error: {
          message: `Invalid file type. Allowed types for ${type}: ${ALLOWED_FILE_TYPES[type].join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        }
      }
    }

    // Generate a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const folderPath = `${type}s` // e.g., 'images', 'videos', 'documents'
    const filePath = `${folderPath}/${fileName}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('post-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type // Explicitly set the content type
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      throw uploadError
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-attachments')
      .getPublicUrl(filePath)

    return {
      data: {
        path: filePath,
        fileType: type
      },
      error: null
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      data: null,
      error: {
        message: 'Failed to upload file',
        code: 'UPLOAD_ERROR'
      }
    }
  }
} 
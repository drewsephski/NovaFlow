import { fetch, Proxy } from '@tauri-apps/plugin-http'
import { WebDAVConfig } from '@/types/sync'

/**
 * WebDAV sync core module
 * Supports Synology, QNAP, Nextcloud and other WebDAV protocol storage
 */

/**
 * Build Basic Auth header
 */
function buildAuthHeader(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`
}

/**
 * Build WebDAV URL
 */
function buildWebDAVUrl(config: WebDAVConfig, key: string): string {
  const baseUrl = config.url.replace(/\/$/, '')
  const prefix = config.pathPrefix ? config.pathPrefix.trim().replace(/\/+$/, '') : ''
  const fullKey = prefix ? `${prefix}/${key}` : key
  return `${baseUrl}/${fullKey}`
}

/**
 * Test WebDAV connection
 */
export async function testWebDAVConnection(config: WebDAVConfig, proxy?: Proxy): Promise<boolean> {
  try {
    const baseUrl = config.url.replace(/\/$/, '')
    const response = await fetch(baseUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password),
        'Depth': '0'
      },
      proxy
    })

    return response.status === 207  // 207 Multi-Status indicates success
  } catch (error) {
    console.error('WebDAV connection test failed:', error)
    return false
  }
}

/**
 * Create all parent directories
 */
async function ensureParentDirsExist(
  config: WebDAVConfig,
  key: string,
  proxy?: Proxy
): Promise<boolean> {
  const pathPrefix = config.pathPrefix ? config.pathPrefix.trim().replace(/\/+$/, '') : ''

  // First ensure pathPrefix directory exists
  if (pathPrefix) {
    // Create directory directly with baseUrl + pathPrefix, bypassing webdavMkcol (it would duplicate pathPrefix)
    const baseUrl = config.url.replace(/\/$/, '')
    const mkcolUrl = `${baseUrl}/${pathPrefix}`

    await fetch(mkcolUrl, {
      method: 'MKCOL',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password)
      }
    })
  }

  const parts = key.split('/').filter(p => p)
  // Build all possible parent directory paths
  for (let i = 1; i < parts.length; i++) {
    const parentPath = parts.slice(0, i).join('/')
    await webdavMkcol(config, parentPath, proxy)
  }
  return true
}

/**
 * Upload file to WebDAV
 */
export async function webdavUpload(
  config: WebDAVConfig,
  key: string,
  content: string,
  proxy?: Proxy
): Promise<{ etag: string } | null> {
  try {
    // Ensure parent directories exist first
    await ensureParentDirsExist(config, key, proxy)

    const url = buildWebDAVUrl(config, key)
    const contentBytes = new TextEncoder().encode(content)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password),
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Length': contentBytes.byteLength.toString()
      },
      body: contentBytes,
      proxy
    })

    if (response.status === 201 || response.status === 204) {
      const etag = response.headers.get('ETag') || ''
      return { etag }
    } else {
      const errorText = await response.text()
      console.error('WebDAV Upload failed:', response.status, errorText)
      return null
    }
  } catch (error) {
    console.error('WebDAV upload error:', error)
    return null
  }
}

/**
 * Download file from WebDAV
 */
export async function webdavDownload(
  config: WebDAVConfig,
  key: string,
  proxy?: Proxy
): Promise<{ content: string; etag: string; lastModified: string } | null> {
  try {
    const url = buildWebDAVUrl(config, key)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password)
      },
      proxy
    })

    if (response.status === 200) {
      const content = await response.text()
      const etag = response.headers.get('ETag') || ''
      const lastModified = response.headers.get('Last-Modified') || ''

      return { content, etag, lastModified }
    } else if (response.status === 404) {
      return null
    } else {
      const errorText = await response.text()
      console.error('WebDAV Download failed:', response.status, errorText)
      return null
    }
  } catch (error) {
    console.error('WebDAV download error:', error)
    return null
  }
}

/**
 * Delete WebDAV file
 */
export async function webdavDelete(config: WebDAVConfig, key: string, proxy?: Proxy): Promise<boolean> {
  try {
    const url = buildWebDAVUrl(config, key)

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password)
      },
      proxy
    })

    return response.status === 204 || response.status === 200
  } catch (error) {
    console.error('WebDAV delete error:', error)
    return false
  }
}

/**
 * Get file info (HEAD request)
 */
export async function webdavHeadObject(
  config: WebDAVConfig,
  key: string,
  proxy?: Proxy
): Promise<{ etag: string; lastModified: string } | null> {
  try {
    const url = buildWebDAVUrl(config, key)

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password)
      },
      proxy
    })

    if (response.status === 200) {
      const etag = response.headers.get('ETag') || ''
      const lastModified = response.headers.get('Last-Modified') || ''

      return { etag, lastModified }
    } else if (response.status === 404 || response.status === 409) {
      // File doesn't exist, return null
      return null
    } else {
      const errorText = await response.text()
      console.error('WebDAV HeadObject failed:', response.status, errorText)
      return null
    }
  } catch (error) {
    console.error('WebDAV head error:', error)
    return null
  }
}

/**
 * List WebDAV files
 */
export async function webdavListObjects(
  config: WebDAVConfig,
  prefix: string,
  proxy?: Proxy
): Promise<Array<{ key: string; etag: string; lastModified: string; size: number }>> {
  try {
    const baseUrl = config.url.replace(/\/$/, '')
    const pathPrefix = config.pathPrefix ? config.pathPrefix.trim().replace(/\/+$/, '') : ''
    // No trailing slash
    const fullPrefix = pathPrefix ? (prefix ? `${pathPrefix}/${prefix}` : pathPrefix) : prefix

    const response = await fetch(`${baseUrl}/${fullPrefix}`, {
      method: 'PROPFIND',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password),
        'Depth': '1'
      },
      proxy
    })

    if (response.status === 207) {
      const text = await response.text()
      return parsePropfindResponse(text, fullPrefix)
    } else if (response.status === 404 || response.status === 409) {
      // Directory doesn't exist is normal, no need to log error
      return []
    } else {
      const errorText = await response.text()
      console.error('WebDAV ListObjects failed:', response.status, errorText)
      return []
    }
  } catch (error) {
    console.error('WebDAV list error:', error)
    return []
  }
}

/**
 * Parse PROPFIND response XML
 */
function parsePropfindResponse(
  xml: string,
  prefix: string
): Array<{ key: string; etag: string; lastModified: string; size: number }> {
  const results: Array<{ key: string; etag: string; lastModified: string; size: number }> = []

  try {
    // Use regex to parse XML response
    // Extract all response elements
    const responseRegex = /<d:response>([\s\S]*?)<\/d:response>/g
    let match

    while ((match = responseRegex.exec(xml)) !== null) {
      const responseContent = match[1]

      // Extract href
      const hrefMatch = /<d:href>([^<]+)<\/d:href>/.exec(responseContent)
      // Extract getetag
      const etagMatch = /<d:getetag>([^<]+)<\/d:getetag>/.exec(responseContent)
      // Extract getlastmodified
      const lastModMatch = /<d:getlastmodified>([^<]+)<\/d:getlastmodified>/.exec(responseContent)
      // Extract getcontentlength
      const sizeMatch = /<d:getcontentlength>([^<]+)<\/d:getcontentlength>/.exec(responseContent)

      if (hrefMatch) {
        let href = hrefMatch[1]

        // Nutstore returns href with /dav/ prefix, need to remove
        if (href.startsWith('/dav/')) {
          href = href.substring(5) // Remove /dav/
        }

        // Skip root directory itself
        if (href === `${prefix}/` || href === prefix || href.endsWith('/')) {
          // This is a directory, skip directories in file list
          continue
        }

        // Remove prefix to restore relative path
        if (prefix && href.startsWith(`${prefix}/`)) {
          href = href.substring(`${prefix}/`.length)
        } else if (prefix && href.startsWith(prefix)) {
          href = href.substring(prefix.length)
        }

        // Remove leading slashes
        href = href.replace(/^\/+/, '')

        // URL decode
        try {
          href = decodeURIComponent(href)
        } catch {
          // Keep original if decode fails
        }

        results.push({
          key: href,
          etag: etagMatch ? etagMatch[1].replace(/"/g, '') : '',
          lastModified: lastModMatch ? lastModMatch[1] : '',
          size: sizeMatch ? parseInt(sizeMatch[1], 10) : 0
        })
      }
    }
  } catch (error) {
    console.error('Error parsing PROPFIND response:', error)
  }

  return results
}

/**
 * Create directory
 */
export async function webdavMkcol(
  config: WebDAVConfig,
  path: string,
  proxy?: Proxy
): Promise<boolean> {
  try {
    const baseUrl = config.url.replace(/\/$/, '')
    const pathPrefix = config.pathPrefix ? config.pathPrefix.trim().replace(/\/+$/, '') : ''
    const fullPath = pathPrefix ? `${pathPrefix}/${path}` : path

    const response = await fetch(`${baseUrl}/${fullPath}`, {
      method: 'MKCOL',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password)
      },
      proxy
    })

    // 201 means created successfully, 405 means already exists
    return response.status === 201 || response.status === 405
  } catch (error) {
    console.error('WebDAV mkcol error:', error)
    return false
  }
}

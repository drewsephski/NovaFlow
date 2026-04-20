/**
 * Event reporting utility functions
 * Used to report app events to toolsetlink API
 */

import CryptoJS from 'crypto-js'
import { arch, platform } from '@tauri-apps/plugin-os'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'
import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'

// Configuration constants
const API_CONFIG = {
  baseURL: 'https://api.upgrade.toolsetlink.com',
  accessKey: 'wHi8Tkuc5i6v1UCAuVk48A',
  secretKey: 'eg4upYo7ruJgaDVOtlHJGj4lyzG4Oh9IpLGwOc6Oehw',
  appKey: 'tyEi-iLVFxnRhGc9c_xApw',
}

// Event type enum
export enum EventType {
  APP_START = 'app_start',
  APP_UPGRADE_DOWNLOAD = 'app_upgrade_download',
  APP_UPGRADE_UPGRADE = 'app_upgrade_upgrade',
}

// Event data interface
export interface AppStartEventData {
  launchTime: string // RFC3339 format
  versionCode: number
  devModelKey?: string
  devKey?: string
  target?: string
  arch?: string
}

export interface AppUpgradeDownloadEventData {
  downloadVersionCode: number
  code: number // 0: success, 1: failure
  versionCode: number
  devModelKey?: string
  devKey?: string
  target?: string
  arch?: string
}

export interface AppUpgradeUpgradeEventData {
  upgradeVersionCode: number
  code: number // 0: success, 1: failure
  versionCode: number
  devModelKey?: string
  devKey?: string
  target?: string
  arch?: string
}

export type EventData = AppStartEventData | AppUpgradeDownloadEventData | AppUpgradeUpgradeEventData

// Request body interface
interface ReportRequestBody {
  eventType: EventType
  appKey: string
  timestamp: string
  eventData: EventData
}

/**
 * Generate RFC3339 format timestamp
 * Uses UTC time to avoid timezone issues
 */
function generateRFC3339Timestamp(): string {
  const now = new Date()
  return now.toISOString()
}

/**
 * Generate random Nonce (at least 16 characters)
 */
function generateNonce(): string {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

/**
 * Generate request signature
 * Signature rule: MD5(body=${body}&nonce=${nonce}&secretKey=${secretKey}&timestamp=${timestamp}&url=${url})
 */
function generateSignature(
  body: string,
  nonce: string,
  timestamp: string,
  url: string,
  secretKey: string
): string {
  const signStr = `body=${body}&nonce=${nonce}&secretKey=${secretKey}&timestamp=${timestamp}&url=${url}`
  return CryptoJS.MD5(signStr).toString()
}

// Check if running in Tauri environment
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

/**
 * Get current app version code
 * Get version from runtime and convert to number format
 * Example: "0.22.2" -> 22002, "1.22.2" -> 1022002
 * Each dot-separated number takes 3 digits, base 1000
 */
async function getVersionCode(): Promise<number> {
  // Skip in non-Tauri environment
  if (!isTauriEnvironment()) {
    return 1
  }
  try {
    // Get version from runtime
    const version = await getVersion()
    const versionParts = version.split('.')

    // Ensure 3 parts, pad with zeros if needed
    const major = parseInt(versionParts[0] || '0', 10)
    const minor = parseInt(versionParts[1] || '0', 10)
    const patch = parseInt(versionParts[2] || '0', 10)

    // Convert to number: major * 1000000 + minor * 1000 + patch
    return major * 1000000 + minor * 1000 + patch
  } catch (error) {
    console.error('Failed to get version code:', error)
    return 1
  }
}

/**
 * Get device unique identifier
 * - Desktop: Use hardware unique identifier (machine-uid)
 * - Mobile: Use UUID and persist storage (resets after app uninstall)
 */
async function getDeviceId(): Promise<string | undefined> {
  try {
    const deviceId = await invoke<string>('get_device_id')
    return deviceId
  } catch (error) {
    console.error('Failed to get device ID:', error)
    return undefined
  }
}

/**
 * Get device info
 */
async function getDeviceInfo() {
  // Skip in non-Tauri environment
  if (!isTauriEnvironment()) {
    return {
      target: undefined,
      arch: undefined,
      devKey: undefined,
    }
  }
  try {
    const targetPlatform = await platform()
    const archInfo = await arch()
    const deviceId = await getDeviceId()

    return {
      target: targetPlatform,
      arch: archInfo,
      devKey: deviceId,
    }
  } catch (error) {
    console.error('Failed to get device info:', error)
    return {
      target: undefined,
      arch: undefined,
      devKey: undefined,
    }
  }
}

/**
 * Report event
 */
export async function reportEvent(
  eventType: EventType,
  eventData: EventData
): Promise<boolean> {
  try {
    const timestamp = generateRFC3339Timestamp()
    const nonce = generateNonce()
    const url = '/v1/app/report'
    
    const requestBody: ReportRequestBody = {
      eventType,
      appKey: API_CONFIG.appKey,
      timestamp,
      eventData,
    }
    
    const bodyString = JSON.stringify(requestBody)
    const signature = generateSignature(
      bodyString,
      nonce,
      timestamp,
      url,
      API_CONFIG.secretKey
    )
    
    const response = await tauriFetch(`${API_CONFIG.baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-AccessKey': API_CONFIG.accessKey,
        'X-Signature': signature,
      },
      body: bodyString,
    })
    
    const result = await response.json()

    if (response.ok && result.code === 0) {
      return true
    } else {
      console.error('Failed to report event:', result)
      return false
    }
  } catch (error) {
    console.error('Error reporting event:', error)
    return false
  }
}

/**
 * Report app start event
 */
export async function reportAppStart(): Promise<boolean> {
  // Skip in non-Tauri environment
  if (!isTauriEnvironment()) {
    return false
  }
  try {
    const versionCode = await getVersionCode()
    const deviceInfo = await getDeviceInfo()
    const launchTime = generateRFC3339Timestamp()

    const eventData: AppStartEventData = {
      launchTime,
      versionCode,
      devKey: deviceInfo.devKey,
      target: deviceInfo.target,
      arch: deviceInfo.arch,
    }

    return await reportEvent(EventType.APP_START, eventData)
  } catch (error) {
    console.error('Failed to report app start:', error)
    return false
  }
}

/**
 * Report app upgrade download event
 */
export async function reportAppUpgradeDownload(
  downloadVersionCode: number,
  code: number
): Promise<boolean> {
  try {
    const versionCode = await getVersionCode()
    const deviceInfo = await getDeviceInfo()
    
    const eventData: AppUpgradeDownloadEventData = {
      downloadVersionCode,
      code,
      versionCode,
      devKey: deviceInfo.devKey,
      target: deviceInfo.target,
      arch: deviceInfo.arch,
    }
    
    return await reportEvent(EventType.APP_UPGRADE_DOWNLOAD, eventData)
  } catch (error) {
    console.error('Failed to report app upgrade download:', error)
    return false
  }
}

/**
 * Report app upgrade event
 */
export async function reportAppUpgradeUpgrade(
  upgradeVersionCode: number,
  code: number
): Promise<boolean> {
  try {
    const versionCode = await getVersionCode()
    const deviceInfo = await getDeviceInfo()
    
    const eventData: AppUpgradeUpgradeEventData = {
      upgradeVersionCode,
      code,
      versionCode,
      devKey: deviceInfo.devKey,
      target: deviceInfo.target,
      arch: deviceInfo.arch,
    }
    
    return await reportEvent(EventType.APP_UPGRADE_UPGRADE, eventData)
  } catch (error) {
    console.error('Failed to report app upgrade:', error)
    return false
  }
}

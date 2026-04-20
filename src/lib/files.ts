import { readDir, BaseDirectory, DirEntry } from "@tauri-apps/plugin-fs";
import { getFilePathOptions, getWorkspacePath } from "./workspace";
import { join } from "@tauri-apps/api/path";

export interface MarkdownFile {
  name: string;
  path: string;
  relativePath: string;
  modifiedAt?: Date;
  /** File metadata (only returned when includeMetadata=true) */
  metadata?: {
    size?: number;           // File size in bytes
    modifiedAt?: Date;       // Last modified time
    createdAt?: Date;        // Creation time
    accessedAt?: Date;       // Last access time
    isReadOnly?: boolean;    // Whether read-only
  };
}

// Folder association interface
export interface LinkedFolder {
  name: string;           // Folder name
  path: string;           // Full path
  relativePath: string;   // Relative path
  fileCount: number;      // Number of markdown files contained
  indexedCount: number;   // Number of indexed files
}

// Unified linked resource type
export type LinkedResource = MarkdownFile | LinkedFolder;

// Type guard: check if it's a folder
export function isLinkedFolder(resource: LinkedResource): resource is LinkedFolder {
  return 'fileCount' in resource;
}

// Collect all Markdown files under a folder
export async function collectMarkdownFiles(folderPath: string): Promise<Array<{path: string, name: string}>> {
  const files: Array<{path: string, name: string}> = [];
  
  const processDirectory = async (dirPath: string) => {
    try {
      const workspace = await getWorkspacePath();
      const pathOptions = await getFilePathOptions(dirPath);
      
      let entries;
      if (workspace.isCustom) {
        entries = await readDir(pathOptions.path);
      } else {
        entries = await readDir(pathOptions.path, { baseDir: pathOptions.baseDir });
      }
      
      for (const entry of entries) {
        const entryPath = dirPath ? `${dirPath}/${entry.name}` : entry.name;
        
        // Filter hidden folders
        if (entry.name.startsWith('.')) {
          continue;
        }
        
        if (entry.isDirectory) {
          // Recursively process subdirectories
          await processDirectory(entryPath);
        } else if (entry.name.endsWith('.md')) {
          // Add Markdown file
          files.push({
            path: entryPath,
            name: entry.name
          });
        }
      }
    } catch (error) {
      console.error(`Failed to read directory ${dirPath}:`, error);
    }
  };
  
  await processDirectory(folderPath);
  return files;
}

/**
 * Get all Markdown files in workspace (flattens all folders)
 * @param includeMetadata Whether to include file metadata (e.g., modification time), default false
 */
export async function getAllMarkdownFiles(includeMetadata: boolean = false): Promise<MarkdownFile[]> {
  const workspace = await getWorkspacePath();


  const files: MarkdownFile[] = [];

  // Helper function to recursively process directories
  async function processDirectory(dirPath: string, useCustomPath: boolean, relativePath: string = "", depth: number = 0): Promise<void> {
    let entries: DirEntry[];

    try {
      if (useCustomPath) {
        entries = await readDir(dirPath);
      } else {
        entries = await readDir(dirPath, { baseDir: BaseDirectory.AppData });
      }

      for (const entry of entries) {
        // Skip hidden files and folders
        if (entry.name === '.DS_Store' || entry.name.startsWith('.')) {
          continue;
        }

        const currentRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory) {
          // Recursively process subdirectories
          const childPath = await join(dirPath, entry.name);
          await processDirectory(childPath, useCustomPath, currentRelativePath, depth + 1);
        } else if (entry.name.endsWith('.md')) {
          // Add Markdown file
          const fullPath = useCustomPath
            ? await join(dirPath, entry.name)
            : currentRelativePath;

          const fileInfo: MarkdownFile = {
            name: entry.name,
            path: fullPath,
            relativePath: currentRelativePath
          };

          // If metadata needed, get full file metadata
          if (includeMetadata) {
            try {
              const { stat } = await import('@tauri-apps/plugin-fs');
              // Use getFilePathOptions to get correct path (compatible with custom and default workspaces)
              const pathOptions = await getFilePathOptions(currentRelativePath);
              const metadata = pathOptions.baseDir
                ? await stat(pathOptions.path, { baseDir: pathOptions.baseDir })
                : await stat(pathOptions.path);

              // Store modifiedAt for compatibility
              fileInfo.modifiedAt = metadata.mtime ?? undefined;

              // Store full metadata
              fileInfo.metadata = {
                size: metadata.size,
                modifiedAt: metadata.mtime ?? undefined,
                createdAt: metadata.birthtime ?? undefined,
                accessedAt: metadata.atime ?? undefined,
                isReadOnly: metadata.readonly,
              };
            } catch (error) {
              console.warn(`[getAllMarkdownFiles] Failed to get file metadata: ${currentRelativePath}`, error);
            }
          }

          files.push(fileInfo);
        }
      }
    } catch (error) {
      console.error(`Directory processing failed`, {
        dirPath,
        error: String(error),
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Start processing root directory
  const rootPath = workspace.isCustom ? workspace.path : 'article';

  await processDirectory(rootPath, workspace.isCustom);

  return files;
}
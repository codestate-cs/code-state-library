export interface IDE {
  name: string;
  command: string;
  args: string[];
  supportedPlatforms: string[];
}

export interface FileOpenRequest {
  ide: string;
  projectRoot: string;
  files: FileToOpen[];
}

export interface FileToOpen {
  path: string;
  line?: number;
  column?: number;
  isActive?: boolean;
} 
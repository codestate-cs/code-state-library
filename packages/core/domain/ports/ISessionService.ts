import { Session } from '../models/Session';
import { Result } from '../models/Result';

export interface ISessionService {
  saveSession(input: Partial<Session> & { name: string; projectRoot: string; notes?: string; tags?: string[] }): Promise<Result<Session>>;
  updateSession(idOrName: string, input: Partial<Session> & { notes?: string; tags?: string[] }): Promise<Result<Session>>;
  resumeSession(idOrName: string): Promise<Result<Session>>;
  listSessions(filter?: { tags?: string[]; search?: string }): Promise<Result<Session[]>>;
  deleteSession(idOrName: string): Promise<Result<void>>;
  exportSession(idOrName: string, outputPath: string): Promise<Result<string>>;
  importSession(filePath: string): Promise<Result<Session>>;
}
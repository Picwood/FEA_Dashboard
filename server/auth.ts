import { storage } from "./storage";

export interface AuthUser {
  id: number;
  username: string;
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    return null;
  }

  // Simple password check for demo (in production, use bcrypt)
  const validCredentials = 
    (username === "admin" && password === "admin") ||
    (username === "engineer" && password === "engineer123");
    
  if (!validCredentials) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
  };
}

export function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any)?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

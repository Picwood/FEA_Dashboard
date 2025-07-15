import { storage } from "./storage";
import * as bcrypt from "bcrypt";

export interface AuthUser {
  id: number;
  username: string;
  role?: "admin" | "engineer";
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    return null;
  }

  // Use bcrypt to verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: username === "admin" ? "admin" : "engineer",
  };
}

export function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any)?.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

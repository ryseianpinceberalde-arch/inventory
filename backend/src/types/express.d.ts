declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      roleId: string;
      roleName: string;
      email: string;
      fullName: string;
      permissions: string[];
    }

    interface Request {
      user?: User;
    }
  }
}

export {};

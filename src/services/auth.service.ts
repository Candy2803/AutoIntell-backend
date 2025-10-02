import type { Request, Response } from 'express';
import { auth, db } from '#firebase/firebase-admin.ts';
import { cookies as cookieUtil } from '#utils/cookies.ts';

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// TypeScript interfaces
export interface SignUpParams {
  uid?: string;
  name: string;
  email: string;
  password?: string;
}

export interface SignInParams {
  email: string;
  idToken: string;
}

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  profileURL?: string;
  resumeURL?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

// Set session cookie
export async function setSessionCookie(idToken: string, res: Response): Promise<void> {
  try {
    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION * 1000, // milliseconds
    });

    // Set cookie in the browser
    cookieUtil.set(res, 'session', sessionCookie, {
      maxAge: SESSION_DURATION * 1000, // Express expects milliseconds
      sameSite: 'lax',
    });
  } catch (error) {
    console.error('Error setting session cookie:', error);
    throw new Error('Failed to set session cookie');
  }
}

export async function createUser(params: SignUpParams): Promise<AuthResponse & { uid?: string }> {
  const { name, email, password } = params;

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Save user to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      uid: userRecord.uid,
      createdAt: new Date().toISOString(),
    });

    const user: User = {
      id: userRecord.uid,
      uid: userRecord.uid,
      name,
      email,
    };

    return {
      success: true,
      message: 'Account created successfully.',
      user,
      uid: userRecord.uid,
    };
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle Firebase specific errors
    if (error.code === 'auth/email-already-exists') {
      return {
        success: false,
        message: 'This email is already in use',
      };
    }

    return {
      success: false,
      message: 'Failed to create account. Please try again.',
    };
  }
}

// Firebase sign in with email and password (server-side verification)
export async function authenticateWithEmailPassword(email: string, password: string): Promise<AuthResponse> {
  try {
    // Note: Firebase Admin SDK doesn't support password verification directly
    // This would typically be done on the client-side, then verified with ID token
    // For now, we'll get user by email and assume password is verified client-side
    const userRecord = await auth.getUserByEmail(email);
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return {
        success: false,
        message: 'User profile not found.',
      };
    }
    
    const userData = userDoc.data();
    const user: User = {
      id: userRecord.uid,
      uid: userRecord.uid,
      name: userData?.name || userRecord.displayName || '',
      email: userRecord.email || email,
      profileURL: userData?.profileURL,
      resumeURL: userData?.resumeURL,
    };

    return {
      success: true,
      message: 'Authentication successful.',
      user,
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return {
        success: false,
        message: 'User with this email does not exist',
      };
    }
    
    return {
      success: false,
      message: 'Invalid email or password',
    };
  }
}

export async function signIn(params: SignInParams, res: Response): Promise<AuthResponse> {
  const { email, idToken } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord) {
      return {
        success: false,
        message: 'User does not exist. Create an account.',
      };
    }

    await setSessionCookie(idToken, res);
    
    // Get user data from database
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();
    
    return {
      success: true,
      message: 'Successfully signed in.',
      user: userData ? {
        id: userDoc.id,
        uid: userRecord.uid,
        ...userData,
      } as User : undefined,
    };
  } catch (error: any) {
    console.error('Sign in error:', error);

    return {
      success: false,
      message: 'Failed to log into account. Please try again.',
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut(res: Response): Promise<void> {
  cookieUtil.clear(res, 'session', { sameSite: 'lax' });
}

// Get current user from session cookie
export async function getCurrentUser(req: Request): Promise<User | null> {
  const sessionCookie = cookieUtil.get(req, 'session');
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // Get user info from db
    const userRecord = await db
      .collection('users')
      .doc(decodedClaims.uid)
      .get();
    if (!userRecord.exists) return null;

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.error('Get current user error:', error);
    // Invalid or expired session
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated(req: Request): Promise<boolean> {
  const user = await getCurrentUser(req);
  return !!user;
}

// Middleware function to authenticate requests (Firebase session cookie)
export async function authenticateSession(req: Request, res: Response, next: any): Promise<void> {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Add user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session',
    });
  }
}

// Get user session info (useful for debugging)
// export async function getSessionInfo(req: Request): Promise<{
//   hasSession: boolean;
//   isValid: boolean;
//   user?: User;
// }> {
//   const sessionCookie = req.cookies?.session;
//
//   if (!sessionCookie) {
//     return {
//       hasSession: false,
//       isValid: false,
//     };
//   }
//
//   try {
//     const user = await getCurrentUser(req);
//     return {
//       hasSession: true,
//       isValid: !!user,
//       user: user || undefined,
//     };
//   } catch (error) {
//     return {
//       hasSession: true,
//       isValid: false,
//     };
//   }
// }

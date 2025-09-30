import type { Request, Response, NextFunction } from 'express';
import logger from '#config/logger.ts';
import { signinSchema, signupSchema } from '#validations/auth.validation.ts';
import { formatValidationError } from '#utils/format.ts';
import { createUser, authenticateWithEmailPassword, signOut as signOutService } from '#services/auth.service.ts';
import { jwttoken } from '#utils/jwt.ts';
import { cookies } from '#utils/cookies.ts';

export const signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = signupSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                error: 'Validation failed.',
                details: formatValidationError(validationResult.error),
            });
            return;
        }
        
        const { name, email, password } = validationResult.data;

        const result = await createUser({ name, email, password });

        if (!result.success) {
            res.status(400).json({
                error: result.message,
            });
            return;
        }

        // Create JWT token for the created user
        const token = jwttoken.sign({
            uid: result.uid,
            email: email,
        });

        cookies.set(res, 'token', token);

        logger.info(`User registered successfully: ${email}`);

        res.status(201).json({
            message: result.message,
            user: result.user,
        });
    } catch (e: any) {
        logger.error('SignUp Error', e);
        
        if (e.code === 'auth/email-already-exists') {
            res.status(409).json({ error: 'Email already exists' });
            return;
        }

        next(e);
    }
};

export const signin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validationResult = signinSchema.safeParse(req.body);

        if (!validationResult.success) {
            res.status(400).json({
                error: 'Validation failed.',
                details: formatValidationError(validationResult.error),
            });
            return;
        }

        const { email, password } = validationResult.data;

        const result = await authenticateWithEmailPassword(email, password);

        if (!result.success) {
            res.status(401).json({
                error: result.message,
            });
            return;
        }

        const token = jwttoken.sign({
            uid: result.user?.uid,
            email: result.user?.email,
        });

        cookies.set(res, 'token', token);

        logger.info(`User signed in successfully: ${email}`);
        res.status(200).json({
            message: result.message,
            user: result.user,
        });
    } catch (e: any) {
        logger.error('SignIn Error', e);
        next(e);
    }
};

export const signout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Clear JWT token cookie
        cookies.clear(res, 'token');
        
        // Also clear Firebase session cookie if exists
        await signOutService(res);

        logger.info('User signed out successfully');
        res.status(200).json({
            message: 'User signed out successfully',
        });
    } catch (e: any) {
        logger.error('SignOut Error', e);
        next(e);
    }
};

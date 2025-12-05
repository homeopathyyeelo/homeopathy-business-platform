import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { validateAccessToken, mapAuthServiceUser } from '@/lib/server/auth-service';
import { query } from '@/lib/database';
import crypto from 'crypto';

// Encryption key (should be in environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'your-32-character-secret-key-here';

// Encrypt password using AES-256
function encryptPassword(password: string): { encrypted: string; iv: string } {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        encrypted,
        iv: iv.toString('hex'),
    };
}

export async function POST(request: NextRequest) {
    try {
        // Get user from request (headers)
        let user = getUserFromRequest(request);

        // Fallback: Check cookie if header auth fails
        if (!user) {
            const token = request.cookies.get("auth-token")?.value;
            if (token) {
                const authUser = await validateAccessToken(token);
                if (authUser) {
                    user = {
                        id: authUser.id,
                        email: authUser.email,
                        name: authUser.name,
                        role: authUser.role as any, // Cast to match UserRole enum if needed
                        isActive: true,
                        permissions: authUser.permissions,
                        isSuperAdmin: authUser.isSuperAdmin,
                    };
                }
            }
        }

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({
                success: false,
                error: 'Email and password are required'
            }, { status: 400 });
        }

        // Encrypt password
        const { encrypted, iv } = encryptPassword(password);

        // Save to database directly
        const insertQuery = `
            INSERT INTO gmb_automation_credentials (
                user_id, 
                gmb_email, 
                gmb_password_encrypted, 
                encryption_key, 
                is_active,
                updated_at
            ) VALUES ($1, $2, $3, $4, true, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                gmb_email = EXCLUDED.gmb_email,
                gmb_password_encrypted = EXCLUDED.gmb_password_encrypted,
                encryption_key = EXCLUDED.encryption_key,
                is_active = true,
                updated_at = NOW()
            RETURNING id
        `;

        await query(insertQuery, [
            user.id,
            email,
            encrypted,
            iv
        ]);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error saving GMB credentials:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // The authentication requires the CLERK_SECRET_KEY to be set in the env
      const requestState = await clerkClient.authenticateRequest({
        request,
        secretKey: process.env.CLERK_SECRET_KEY,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY
      });

      if (!requestState.isSignedIn) {
        throw new UnauthorizedException('No token provided or invalid');
      }

      // Store clerk token payload in request.user
      request.user = requestState.toAuth();
      return true;
    } catch (err) {
      console.error('Clerk Token verification failed:', err);
      throw new UnauthorizedException('Invalid token');
    }
  }
}

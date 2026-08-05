import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
        });
    }

    async validate(payload: { sub?: string; email?: string; employeeId?: string; role?: string }) {
        // Always resolve by `sub` (account id). findByEmail(undefined) can match the wrong row when employees have no email.
        if (!payload.sub) {
            throw new UnauthorizedException('Invalid token');
        }
        const account = await this.usersService.findById(payload.sub);

        if (!account) {
            throw new UnauthorizedException('User not found');
        }

        if (account.role === 'HR' && !account.isVerified) {
            throw new UnauthorizedException('HR account is pending verification');
        }

        return account; // Attaches to req.user
    }
}

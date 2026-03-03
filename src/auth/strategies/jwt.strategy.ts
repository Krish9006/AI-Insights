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

    async validate(payload: any) {
        // payload structure generated in auth.service { sub: user.id, email: user.email, role: user.role }
        const account = await this.usersService.findByEmail(payload.email) || await this.usersService.findByEmployeeId(payload.employeeId);

        if (!account) {
            throw new UnauthorizedException('User not found');
        }

        if (account.role === 'HR' && !account.isVerified) {
            throw new UnauthorizedException('HR account is pending verification');
        }

        return account; // Attaches to req.user
    }
}

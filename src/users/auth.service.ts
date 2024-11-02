import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  async signup(email: string, password: string) {
    // Cek email
    const users = await this.userService.find(email);
    if (users.length) {
      throw new BadRequestException('Email already used!');
    }
    // hash user password

    // salt
    const salt = randomBytes(8).toString('hex');

    //hash the salt and the passwordtogether
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    //  join the hashed result and salt together
    const result = salt + '.' + hash.toString('hex');

    // create and save user
    const user = await this.userService.create(email, result);

    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.userService.find(email);
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    const [salt, storedHash] = user.password.split('.');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('bad password');
    }
    return user;
  }
}

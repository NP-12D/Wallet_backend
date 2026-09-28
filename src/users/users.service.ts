import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, isValidObjectId, Model, Types } from 'mongoose';
import { User, UserDocument } from './schema/user.schema';

type CreateUserInput = {
  username: string;
  email: string;
  password: string;
};

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserInput, session?: ClientSession) {
    const [newUser] = await this.userModel.create(
      [
        {
          ...createUserDto,
          email: createUserDto.email.toLowerCase(),
        },
      ],
      { session },
    );
    return newUser;
  }

  async findOne(id: string | Types.ObjectId) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid MongoDB ID');
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByEmail(email: string, withPassword = false) {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (withPassword) query.select('+password');
    return query;
  }

  async attachWallet(
    userId: string | Types.ObjectId,
    walletId: string | Types.ObjectId,
    session?: ClientSession,
  ) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { walletId }, { new: true, session })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  serialize(user: UserDocument) {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      walletId: user.walletId?.toString(),
    };
  }
}

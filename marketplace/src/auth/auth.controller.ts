import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { BadRequestException, Body, Post } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { Group } from 'src/config/enum';
import { AuthService } from './auth.service';
import { OnlyAllowGroups } from './groups.decorator';
import { GroupsGuard } from './groups.guard';
import { JwtAuthGuard } from './jwt.authguard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'To get JWT token for test',
  })
  async login(@Body() authenticateRequest: { name: string; password: string }) {
    try {
      return await this.authService.authenticateUser(authenticateRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Get('admin')
  @OnlyAllowGroups(Group.Admin)
  @UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Test for oauth token',
  })
  @ApiResponse({
    status: 200,
    description: 'Oauth token works',
  })
  @ApiProduces('application/json')
  async onlyAdmin(@Request() request: any) {
    return {
      message: 'Only admin can see this',
      user: request.user['user'],
      groups: request.user['groups'],
    };
  }
}

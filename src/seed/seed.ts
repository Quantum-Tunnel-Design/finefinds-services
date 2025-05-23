import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ParentSignUpInput } from '../auth/dto/parent-sign-up.input';
import { VendorSignUpInput } from '../auth/dto/vendor-sign-up.input';
import { AdminAccountInput } from '../auth/dto/admin-account.input';
import { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Placeholder for a strong password that meets complexity requirements
// Ensure this password meets your Cognito password policy
const DEFAULT_PASSWORD = 'Password123!';

async function bootstrap() {
  let app: INestApplicationContext | null = null;
  try {
    app = await NestFactory.createApplicationContext(AppModule);
    await app.init();

    const authService = app.get(AuthService);
    const usersService = app.get(UsersService);
    const prisma = app.get(PrismaService);
    const configService = app.get(ConfigService);

    console.log('Starting database seeding...');

    // --- Clean up existing data (optional, use with caution) ---
    // This is useful for development to ensure a clean state.
    // DO NOT run this in production or if you want to preserve data.
    // await prisma.child.deleteMany({});
    // await prisma.businessProfile.deleteMany({});
    // await prisma.classPackage.deleteMany({});
    // await prisma.user.deleteMany({ where: { role: { not: UserRole.ADMIN } } }); // Keep admin for now
    // console.log('Cleaned up existing non-admin users and related data.');

    // --- Seed Admin ---
    const adminEmail = configService.get<string>('SEED_ADMIN_EMAIL') || 'amal.c.gamage@gmail.com';
    const existingAdmin = await usersService.findByEmail(adminEmail);
    if (!existingAdmin) {
      const adminInput: AdminAccountInput = {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        password: DEFAULT_PASSWORD,
      };
      try {
        const adminResult = await authService.createAdminAccount(adminInput);
        console.log(`Admin user ${adminEmail} created. IDToken: ${adminResult.idToken ? 'Generated' : 'Not Generated'}`);
      } catch (error) {
        if (error.message?.includes('Admin account already exists')) {
          console.log(`Admin user ${adminEmail} already exists.`);
        } else {
          console.error(`Error creating admin ${adminEmail}:`, error.message);
        }
      }
    } else {
      console.log(`Admin user ${adminEmail} already exists.`);
    }

    // --- Seed Parents ---
    const parentsData: ParentSignUpInput[] = [
      {
        email: 'parent1@example.com',
        firstName: 'ParentOne',
        lastName: 'Smith',
        password: DEFAULT_PASSWORD,
        confirmPassword: DEFAULT_PASSWORD,
        phoneNumber: '+94771234567',
        children: [
          { firstName: 'ChildOne', lastName: 'Smith', gender: 'male', dateOfBirth: new Date('2018-05-10') },
          { firstName: 'ChildTwo', lastName: 'Smith', gender: 'female', dateOfBirth: new Date('2020-01-15') },
        ],
      },
      {
        email: 'parent2@example.com',
        firstName: 'ParentTwo',
        lastName: 'Jones',
        password: DEFAULT_PASSWORD,
        confirmPassword: DEFAULT_PASSWORD,
        phoneNumber: '+94777654321',
        children: [
          { firstName: 'ChildThree', lastName: 'Jones', gender: 'female', dateOfBirth: new Date('2019-11-20') },
        ],
      },
    ];

    for (const parentInput of parentsData) {
      const existingParent = await usersService.findByEmail(parentInput.email);
      if (!existingParent) {
        try {
          const parentResult = await authService.parentSignUp(parentInput);
          console.log(`Parent user ${parentInput.email} created. IDToken: ${parentResult.idToken ? 'Generated' : 'Not Generated'}`);
        } catch (error) {
          if (error.message?.includes('Email already registered')) {
             console.log(`Parent user ${parentInput.email} already exists (caught by service).`);
          } else {
            console.error(`Error creating parent ${parentInput.email}:`, error.message);
          }
        }
      } else {
        console.log(`Parent user ${parentInput.email} already exists (checked before signup).`);
      }
    }

    // --- Seed Vendors ---
    const vendorsData: VendorSignUpInput[] = [
      {
        email: 'vendor1@example.com',
        firstName: 'VendorOne',
        lastName: 'Biz',
        password: DEFAULT_PASSWORD,
        confirmPassword: DEFAULT_PASSWORD,
        phoneNumber: '+94711234567',
        secondaryPhoneNumber: '+94711234568',
        termsAccepted: true,
      },
      {
        email: 'vendor2@example.com',
        firstName: 'VendorTwo',
        lastName: 'Services',
        password: DEFAULT_PASSWORD,
        confirmPassword: DEFAULT_PASSWORD,
        phoneNumber: '+94722345678',
        secondaryPhoneNumber: '',
        termsAccepted: true,
      },
    ];

    for (const vendorInput of vendorsData) {
      const existingVendor = await usersService.findByEmail(vendorInput.email);
      if (!existingVendor) {
        try {
          const vendorResult = await authService.vendorSignUp(vendorInput);
          console.log(`Vendor user ${vendorInput.email} created. IDToken: ${vendorResult.idToken ? 'Generated' : 'Not Generated'}`);
        } catch (error) {
           if (error.message?.includes('Email already registered')) {
             console.log(`Vendor user ${vendorInput.email} already exists (caught by service).`);
          } else {
            console.error(`Error creating vendor ${vendorInput.email}:`, error.message);
          }
        }
      } else {
        console.log(`Vendor user ${vendorInput.email} already exists (checked before signup).`);
      }
    }

    console.log('Database seeding finished.');

  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    if (app) {
      await app.close();
    }
    process.exit(0); // Exit script
  }
}

bootstrap(); 
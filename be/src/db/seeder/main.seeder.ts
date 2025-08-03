import { AppDataSource } from '../data-source';
import { User, UserRole } from 'src/entities/user.entity';
import { UserFactory } from '../factory/user.factory';
export class MainSeeder {
  static async seed() {
    await AppDataSource.initialize();
    console.log('✅ Database connection established.');

    const userRepo = AppDataSource.getRepository(User);
    // Seed Users
    const users = await UserFactory.createMany(15);
    await userRepo.save(users);
    console.log(`✅ Seeded ${users.length} users.`);

    await AppDataSource.destroy();
    console.log('🎉 Database seeding completed successfully!');
  }
}

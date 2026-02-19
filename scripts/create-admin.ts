import connectDB from '../lib/mongodb';
import User from '../models/User';
import { hashPassword } from '../lib/auth';

async function createAdmin() {
  try {
    await connectDB();

    const email = process.argv[2] || 'admin@kzkpartizan1953.rs';
    const password = process.argv[3] || 'admin123';

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('Admin korisnik već postoji!');
      process.exit(0);
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('Admin korisnik je uspešno kreiran!');
    console.log(`Email: ${email}`);
    console.log(`Lozinka: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Greška pri kreiranju admin korisnika:', error);
    process.exit(1);
  }
}

createAdmin();


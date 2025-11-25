import connectDB from '../lib/mongodb';
import AdminUser from '../models/AdminUser';
import { hashPassword } from '../lib/auth';

async function addAdmin() {
  try {
    await connectDB();

    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';

    // Proveri da li korisnik već postoji
    const existingUser = await AdminUser.findOne({ username });

    if (existingUser) {
      console.log('Admin korisnik već postoji!');
      console.log(`Username: ${existingUser.username}`);
      process.exit(0);
    }

    // Hash-uj password
    const hashedPassword = await hashPassword(password);

    // Kreiraj admin korisnika
    const admin = await AdminUser.create({
      username,
      password: hashedPassword,
    });

    console.log('✓ Admin korisnik je uspešno kreiran!');
    console.log(`Username: ${admin.username}`);
    console.log(`Password: ${password}`);
    console.log(`ID: ${admin._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Greška pri kreiranju admin korisnika:', error);
    process.exit(1);
  }
}

addAdmin();


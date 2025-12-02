const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    }
};

const createAdmin = async (email, password, name) => {
    try {
        await connectDB();
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.findOneAndUpdate(
            { email },
            {
                email,
                password: hashedPassword,
                name,
                role: 'admin',
                provider: 'credentials'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`✅ Admin created/updated successfully: ${user.email}`);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
};

const listAdmins = async () => {
    await connectDB();
    const admins = await User.find({ role: 'admin' });
    if (admins.length === 0) {
        console.log('No admins found.');
        return [];
    }
    console.log('\n📋 Current Admins:');
    admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name} (${admin.email})`);
    });
    return admins;
};

const deleteAdmin = async (email) => {
    try {
        await connectDB();
        const result = await User.deleteOne({ email, role: 'admin' });
        if (result.deletedCount > 0) {
            console.log(`✅ Admin deleted successfully: ${email}`);
        } else {
            console.log(`❌ Admin not found or not an admin: ${email}`);
        }
    } catch (error) {
        console.error('❌ Error deleting admin:', error);
    }
};

const main = async () => {
    // Check for command line arguments for "Quick Mode"
    const args = process.argv.slice(2);
    if (args.length >= 2) {
        const [email, password, name] = args;
        await createAdmin(email, password, name || 'Admin User');
        process.exit(0);
    }

    // Interactive Mode
    let inquirer;
    try {
        inquirer = require('inquirer');
    } catch (err) {
        console.error('❌ Error: "inquirer" is not installed. Please run "npm install inquirer" in the server directory.');
        process.exit(1);
    }

    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected. Starting menu...');

    while (true) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Admin Management Menu:',
                choices: [
                    { name: '📋 List Admins', value: 'list' },
                    { name: '➕ Create/Update Admin', value: 'create' },
                    { name: '🗑️  Delete Admin', value: 'delete' },
                    { name: '🚪 Exit', value: 'exit' }
                ]
            }
        ]);

        if (action === 'exit') {
            console.log('Goodbye!');
            process.exit(0);
        }

        if (action === 'list') {
            await listAdmins();
        }

        if (action === 'create') {
            const answers = await inquirer.prompt([
                { type: 'input', name: 'name', message: 'Name:', default: 'Admin User' },
                { type: 'input', name: 'email', message: 'Email:', validate: input => input.includes('@') || 'Invalid email' },
                { type: 'password', name: 'password', message: 'Password:', mask: '*' }
            ]);
            await createAdmin(answers.email, answers.password, answers.name);
        }

        if (action === 'delete') {
            const admins = await listAdmins();
            if (admins.length > 0) {
                const { selectedEmail } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'selectedEmail',
                        message: 'Select an admin to delete:',
                        choices: [
                            ...admins.map(admin => ({ name: `${admin.name} (${admin.email})`, value: admin.email })),
                            { name: '🔙 Cancel', value: 'cancel' }
                        ]
                    }
                ]);

                if (selectedEmail !== 'cancel') {
                    const { confirm } = await inquirer.prompt([
                        { type: 'confirm', name: 'confirm', message: `Are you sure you want to delete ${selectedEmail}?`, default: false }
                    ]);

                    if (confirm) {
                        await deleteAdmin(selectedEmail);
                    } else {
                        console.log('Deletion cancelled.');
                    }
                }
            }
        }

        console.log('\n'); // Add spacing
    }
};

main();

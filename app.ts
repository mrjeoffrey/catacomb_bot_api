import express from 'express';
import dotenv from 'dotenv';
import connectDB from './utils/database';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import settingsRoutes from './routes/settingsRoutes';
import levelRoutes from './routes/levelRoutes';
import Level from './models/levelModel';
import Settings from './models/settingsModel';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Connect to Database
connectDB();

// Seed initial data for levels and settings
const seedInitialData = async () => {
    try {
        // Seed Levels
        const levelCount = await Level.countDocuments();
        if (levelCount === 0) {
            const initialLevels = [
                { level: 1, xp_required: 0, seconds_for_next_chest_opening: 120, one_time_bonus_rewards: 'n/a' },
                { level: 2, xp_required: 5000, seconds_for_next_chest_opening: 100, one_time_bonus_rewards: 500 },
                { level: 3, xp_required: 15000, seconds_for_next_chest_opening: 80, one_time_bonus_rewards: 500 },
                { level: 4, xp_required: 45000, seconds_for_next_chest_opening: 70, one_time_bonus_rewards: 500 },
                { level: 5, xp_required: 135000, seconds_for_next_chest_opening: 60, one_time_bonus_rewards: 1000 },
                { level: 6, xp_required: 405000, seconds_for_next_chest_opening: 50, one_time_bonus_rewards: 1000 },
                { level: 7, xp_required: 1215000, seconds_for_next_chest_opening: 40, one_time_bonus_rewards: 1000 },
                { level: 8, xp_required: 3645000, seconds_for_next_chest_opening: 30, one_time_bonus_rewards: 2000 },
                { level: 9, xp_required: 10935000, seconds_for_next_chest_opening: 20, one_time_bonus_rewards: 5000 },
            ];
            await Level.insertMany(initialLevels);
            console.log('Initial levels seeded.');
        }

        // Seed Settings
        const settingsCount = await Settings.countDocuments();
        if (settingsCount === 0) {
            const initialSettings = {
                opening_chest_earning: {
                    golds: [75, 100, 125, 150],
                    xp: 0,
                },
                referral_earning: {
                    gold_percentage: 10,
                    xp: 0,
                },
            };
            await Settings.create(initialSettings);
            console.log('Initial settings seeded.');
        }
    } catch (error) {
        console.error('Error seeding initial data:', error);
    }
};

// Call seeding function
seedInitialData();

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/levels', levelRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

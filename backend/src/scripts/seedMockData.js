import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path'
dotenv.config({ path: path.resolve('../../.env') }); 
import connect from '../db/connectDB.js'; 
import Transaction from '../models/transaction.js';
console.log(process.env.MONGODB_URI)

const userId = new mongoose.Types.ObjectId('687629f68ba729f9938da8b5');

const mockTransactions = [
  // July 2025
  { user: userId, source: 'manual', amount: 2100, currency: 'INR', date: new Date('2025-07-14'), category: 'Shopping', merchant: 'Amazon', rawText: 'Bought Bluetooth Earbuds from Amazon', tags: ['electronics'], confidence: 0.95 },
  { user: userId, source: 'manual', amount: 129, currency: 'INR', date: new Date('2025-07-10'), category: 'Subscriptions', merchant: 'Spotify', rawText: 'Spotify subscription', tags: ['subscription'], confidence: 0.9 },
  { user: userId, source: 'manual', amount: 760, currency: 'INR', date: new Date('2025-07-05'), category: 'Food', merchant: 'Swiggy', rawText: 'Lunch order via Swiggy', tags: ['meal'], confidence: 0.92 },

  // June 2025
  { user: userId, source: 'manual', amount: 3200, currency: 'INR', date: new Date('2025-06-25'), category: 'Travel', merchant: 'Uber', rawText: 'Outstation cab to Chandigarh', tags: ['travel'], confidence: 0.94 },
  { user: userId, source: 'manual', amount: 680, currency: 'INR', date: new Date('2025-06-12'), category: 'Food', merchant: 'Biryani Blues', rawText: 'Dinner from Biryani Blues', tags: ['food'], confidence: 0.92 },

  // May 2025
  { user: userId, source: 'manual', amount: 1050, currency: 'INR', date: new Date('2025-05-21'), category: 'Bills', merchant: 'BSNL', rawText: 'Broadband bill payment', tags: ['utilities'], confidence: 0.91 },
  { user: userId, source: 'manual', amount: 299, currency: 'INR', date: new Date('2025-05-09'), category: 'Subscriptions', merchant: 'Spotify', rawText: 'Spotify Premium plan', tags: ['entertainment'], confidence: 0.89 },
  { user: userId, source: 'manual', amount: 450, currency: 'INR', date: new Date('2025-05-05'), category: 'Fuel', merchant: 'Indian Oil', rawText: 'Petrol refill', tags: ['fuel'], confidence: 0.91 },

  // April 2025
  { user: userId, source: 'manual', amount: 15400, currency: 'INR', date: new Date('2025-04-29'), category: 'Travel', merchant: 'IndiGo', rawText: 'Flight to Goa', tags: ['flight'], confidence: 0.95 },
  { user: userId, source: 'manual', amount: 399, currency: 'INR', date: new Date('2025-04-11'), category: 'Subscriptions', merchant: 'Netflix', rawText: 'Netflix plan', tags: ['subscription'], confidence: 0.9 },

  // March 2025
  { user: userId, source: 'manual', amount: 730, currency: 'INR', date: new Date('2025-03-18'), category: 'Food', merchant: 'Zomato', rawText: 'Zomato lunch', tags: ['meal'], confidence: 0.93 },
  { user: userId, source: 'manual', amount: 2500, currency: 'INR', date: new Date('2025-03-10'), category: 'Shopping', merchant: 'Flipkart', rawText: 'Bought smartwatch', tags: ['gadget'], confidence: 0.94 },

  // February 2025
  { user: userId, source: 'manual', amount: 220, currency: 'INR', date: new Date('2025-02-22'), category: 'Food', merchant: 'Local Dhaba', rawText: 'Dinner at dhaba', tags: ['meal'], confidence: 0.9 },
  { user: userId, source: 'manual', amount: 129, currency: 'INR', date: new Date('2025-02-15'), category: 'Subscriptions', merchant: 'YouTube Premium', rawText: 'YouTube Premium fee', tags: ['subscription'], confidence: 0.88 },
  { user: userId, source: 'manual', amount: 550, currency: 'INR', date: new Date('2025-02-10'), category: 'Fuel', merchant: 'HP', rawText: 'Fuel for scooter', tags: ['fuel'], confidence: 0.91 },

  // January 2025
  { user: userId, source: 'manual', amount: 15000, currency: 'INR', date: new Date('2025-01-25'), category: 'Health', merchant: 'Apollo Hospital', rawText: 'Medical tests and consultation', tags: ['health'], confidence: 0.95 },
  { user: userId, source: 'manual', amount: 480, currency: 'INR', date: new Date('2025-01-12'), category: 'Groceries', merchant: 'BigBasket', rawText: 'Grocery order', tags: ['groceries'], confidence: 0.92 },

  // December 2024
  { user: userId, source: 'manual', amount: 2600, currency: 'INR', date: new Date('2024-12-31'), category: 'Entertainment', merchant: 'INOX', rawText: 'New Year movie with friends', tags: ['entertainment'], confidence: 0.9 },
  { user: userId, source: 'manual', amount: 999, currency: 'INR', date: new Date('2024-12-20'), category: 'Shopping', merchant: 'Myntra', rawText: 'T-shirt & jeans', tags: ['clothing'], confidence: 0.91 },

  // November 2024
  { user: userId, source: 'manual', amount: 325, currency: 'INR', date: new Date('2024-11-15'), category: 'Food', merchant: 'Swiggy', rawText: 'Lunch from McDonald’s', tags: ['meal'], confidence: 0.89 },

  // October 2024
  { user: userId, source: 'manual', amount: 150, currency: 'INR', date: new Date('2024-10-03'), category: 'Subscriptions', merchant: 'Gaana', rawText: 'Gaana music subscription', tags: ['entertainment'], confidence: 0.87 },

  // September 2024
  { user: userId, source: 'manual', amount: 450, currency: 'INR', date: new Date('2024-09-16'), category: 'Groceries', merchant: 'JioMart', rawText: 'Weekly grocery run', tags: ['groceries'], confidence: 0.9 },

  // August 2024
  { user: userId, source: 'manual', amount: 3100, currency: 'INR', date: new Date('2024-08-24'), category: 'Bills', merchant: 'Tata Power', rawText: 'Electricity bill', tags: ['utilities'], confidence: 0.93 },

  // July 2024
  { user: userId, source: 'manual', amount: 190, currency: 'INR', date: new Date('2024-07-10'), category: 'Food', merchant: 'Domino’s', rawText: 'Domino’s pizza', tags: ['meal'], confidence: 0.91 },

  // June 2024
  { user: userId, source: 'manual', amount: 4600, currency: 'INR', date: new Date('2024-06-05'), category: 'Travel', merchant: 'Redbus', rawText: 'Bus to Manali', tags: ['travel'], confidence: 0.94 },

  // May 2024
  { user: userId, source: 'manual', amount: 300, currency: 'INR', date: new Date('2024-05-18'), category: 'Fuel', merchant: 'Indian Oil', rawText: 'Petrol refill', tags: ['fuel'], confidence: 0.9 },

  // April 2024
  { user: userId, source: 'manual', amount: 590, currency: 'INR', date: new Date('2024-04-13'), category: 'Groceries', merchant: 'More Supermarket', rawText: 'Monthly groceries', tags: ['groceries'], confidence: 0.92 },

  // March 2024
  { user: userId, source: 'manual', amount: 169, currency: 'INR', date: new Date('2024-03-20'), category: 'Subscriptions', merchant: 'Hotstar', rawText: 'Hotstar monthly', tags: ['subscription'], confidence: 0.88 },

  // February 2024
  { user: userId, source: 'manual', amount: 880, currency: 'INR', date: new Date('2024-02-08'), category: 'Food', merchant: 'KFC', rawText: 'Chicken bucket', tags: ['meal'], confidence: 0.91 },

  // January 2024
  { user: userId, source: 'manual', amount: 11200, currency: 'INR', date: new Date('2024-01-01'), category: 'Shopping', merchant: 'Croma', rawText: 'Bought new phone', tags: ['electronics'], confidence: 0.96 },
];


const seedData = async () => {
  try {
    await connect(); 

    await Transaction.deleteMany({ user: userId });
    await Transaction.insertMany(mockTransactions);

    console.log('Mock transactions seeded.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();

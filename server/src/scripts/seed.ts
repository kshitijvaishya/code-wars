import '../config/env';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User';
import { Problem } from '../models/Problem';

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create admin user
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD && env.ADMIN_USERNAME) {
    const existing = await User.findOne({ email: env.ADMIN_EMAIL });
    if (!existing) {
      const admin = new User({
        username: env.ADMIN_USERNAME,
        email: env.ADMIN_EMAIL,
        passwordHash: env.ADMIN_PASSWORD,
        role: 'super_admin',
      });
      await admin.save();
      console.log(`✅ Admin user created: ${env.ADMIN_USERNAME}`);
    } else {
      console.log('Admin user already exists');
    }
  }

  // Create sample problems
  const sampleProblems = [
    {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'easy',
      tags: ['arrays', 'hash-table'],
      description: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nYou may assume exactly one solution exists.',
      inputFormat: 'First line: n (array length)\nSecond line: n space-separated integers\nThird line: target integer',
      outputFormat: 'Two space-separated integers: the indices (0-based)',
      constraints: '2 ≤ n ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9\n-10^9 ≤ target ≤ 10^9\nExactly one valid answer exists.',
      sampleTestCases: [
        { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
        { input: '3\n3 2 4\n6', expectedOutput: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
      ],
      hiddenTestCases: [
        { input: '2\n3 3\n6', expectedOutput: '0 1', score: 10 },
        { input: '5\n1 2 3 4 5\n9', expectedOutput: '3 4', score: 10 },
        { input: '4\n-1 -2 -3 -4\n-7', expectedOutput: '2 3', score: 10 },
      ],
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      isPublished: true,
    },
    {
      title: 'Reverse String',
      slug: 'reverse-string',
      difficulty: 'easy',
      tags: ['strings'],
      description: 'Given a string, output its reverse.',
      inputFormat: 'A single line containing the string to reverse.',
      outputFormat: 'The reversed string on a single line.',
      constraints: '1 ≤ |s| ≤ 10^5\nThe string consists of printable ASCII characters.',
      sampleTestCases: [
        { input: 'hello', expectedOutput: 'olleh', explanation: 'h-e-l-l-o reversed is o-l-l-e-h' },
        { input: 'racecar', expectedOutput: 'racecar', explanation: 'A palindrome reverses to itself' },
      ],
      hiddenTestCases: [
        { input: 'abcdefghij', expectedOutput: 'jihgfedcba', score: 10 },
        { input: 'a', expectedOutput: 'a', score: 10 },
        { input: '12345', expectedOutput: '54321', score: 10 },
      ],
      timeLimitMs: 1000,
      memoryLimitMb: 128,
      isPublished: true,
    },
    {
      title: 'FizzBuzz',
      slug: 'fizzbuzz',
      difficulty: 'easy',
      tags: ['math', 'strings'],
      description: 'Print numbers from 1 to N. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".',
      inputFormat: 'A single integer N.',
      outputFormat: 'N lines, each containing the appropriate output.',
      constraints: '1 ≤ N ≤ 10^4',
      sampleTestCases: [
        { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', explanation: '3 → Fizz, 5 → Buzz' },
        { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', explanation: '15 is divisible by both' },
      ],
      hiddenTestCases: [
        { input: '1', expectedOutput: '1', score: 5 },
        { input: '30', expectedOutput: Array.from({ length: 30 }, (_, i) => {
          const n = i + 1;
          if (n % 15 === 0) return 'FizzBuzz';
          if (n % 3 === 0) return 'Fizz';
          if (n % 5 === 0) return 'Buzz';
          return String(n);
        }).join('\n'), score: 10 },
      ],
      timeLimitMs: 1000,
      memoryLimitMb: 128,
      isPublished: true,
    },
    {
      title: 'Binary Search',
      slug: 'binary-search',
      difficulty: 'medium',
      tags: ['binary-search', 'arrays'],
      description: 'Given a **sorted** array of integers and a target, return the index of the target using binary search. Return -1 if not found.',
      inputFormat: 'First line: n (array length)\nSecond line: n sorted space-separated integers\nThird line: target',
      outputFormat: 'Single integer: index of target, or -1 if not found.',
      constraints: '1 ≤ n ≤ 10^6\n-10^9 ≤ nums[i] ≤ 10^9\nArray is sorted in ascending order.',
      sampleTestCases: [
        { input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4', explanation: '9 is at index 4' },
        { input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1', explanation: '2 not in array' },
      ],
      hiddenTestCases: [
        { input: '1\n5\n5', expectedOutput: '0', score: 10 },
        { input: '5\n1 3 5 7 9\n1', expectedOutput: '0', score: 10 },
        { input: '5\n1 3 5 7 9\n9', expectedOutput: '4', score: 10 },
        { input: '5\n1 3 5 7 9\n0', expectedOutput: '-1', score: 10 },
      ],
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      isPublished: true,
    },
  ];

  // Find or create admin for createdBy
  const adminUser = await User.findOne({ role: 'super_admin' });
  if (!adminUser) {
    console.log('No admin user found for seeding problems — create admin first');
    await mongoose.disconnect();
    return;
  }

  for (const p of sampleProblems) {
    const exists = await Problem.findOne({ slug: p.slug });
    if (!exists) {
      await Problem.create({ ...p, createdBy: adminUser._id });
      console.log(`✅ Problem created: ${p.title}`);
    } else {
      console.log(`Problem already exists: ${p.title}`);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding complete!');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

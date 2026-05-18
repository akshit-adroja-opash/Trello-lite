import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Workspace from './src/models/Workspace.js';
import Board from './src/models/Board.js';
import Column from './src/models/Column.js';
import Card from './src/models/Card.js';

dotenv.config();

const seed = async () => {
    await connectDB();

    await Promise.all([
        User.deleteMany({}), Workspace.deleteMany({}),
        Board.deleteMany({}), Column.deleteMany({}), Card.deleteMany({})
    ]);

    const [alice, bob, carol] = await User.create([
        { username: 'alice', email: 'alice@demo.com', password: 'password123' },
        { username: 'bob',   email: 'bob@demo.com',   password: 'password123' },
        { username: 'carol', email: 'carol@demo.com', password: 'password123' },
    ]);

    const workspace = await Workspace.create({
        name: 'Acme Corp',
        description: 'Demo workspace',
        owner: alice._id,
        members: [
            { user: alice._id, role: 'admin' },
            { user: bob._id,   role: 'member' },
            { user: carol._id, role: 'member' },
        ]
    });

    const board = await Board.create({
        name: 'Product Roadmap',
        workspace: workspace._id,
        owner: alice._id,
        background: '#0079bf',
        members: [
            { user: alice._id, role: 'Owner' },
            { user: bob._id,   role: 'Editor' },
            { user: carol._id, role: 'Viewer' },
        ]
    });

    // Columns
    const [todo, inProgress, done] = await Column.create([
        { name: 'To Do',       board: board._id, order: 'a' },
        { name: 'In Progress', board: board._id, order: 'n' },
        { name: 'Done',        board: board._id, order: 'z' },
    ]);

    // Cards
    await Card.create([
        {
            title: 'Design landing page',
            description: 'Create **wireframes** and mockups for the new landing page.',
            column: todo._id, board: board._id, order: 'a',
            assignees: [alice._id],
            labels: [{ name: 'Design', color: '#61bd4f' }],
            dueDate: new Date(Date.now() + 7 * 86400000),
            checklist: [
                { text: 'Wireframes', done: true },
                { text: 'Mockups', done: false },
                { text: 'Handoff to dev', done: false },
            ]
        },
        {
            title: 'Set up CI/CD pipeline',
            description: 'Configure GitHub Actions for automated testing and deployment.',
            column: todo._id, board: board._id, order: 'n',
            assignees: [bob._id],
            labels: [{ name: 'DevOps', color: '#0079bf' }],
        },
        {
            title: 'Implement auth',
            description: 'JWT-based authentication with refresh tokens.',
            column: inProgress._id, board: board._id, order: 'a',
            assignees: [alice._id, bob._id],
            labels: [{ name: 'Backend', color: '#eb5a46' }],
            dueDate: new Date(Date.now() + 2 * 86400000),
        },
        {
            title: 'Write API docs',
            description: 'Document all REST endpoints using OpenAPI spec.',
            column: inProgress._id, board: board._id, order: 'n',
            assignees: [carol._id],
            labels: [{ name: 'Docs', color: '#ff9f1a' }],
        },
        {
            title: 'Project kickoff',
            description: 'Initial team meeting and project setup.',
            column: done._id, board: board._id, order: 'a',
            labels: [{ name: 'Meeting', color: '#c377e0' }],
        },
    ]);

    console.log('✅ Seed complete!');
    console.log('   alice@demo.com / password123  (Owner)');
    console.log('   bob@demo.com   / password123  (Editor)');
    console.log('   carol@demo.com / password123  (Viewer)');
    process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });

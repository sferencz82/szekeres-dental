import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
});

console.log('env loaded from', path.resolve(__dirname, '../.env.local'));
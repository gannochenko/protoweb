#!/usr/bin/env node

import debug from 'debug';
import { Application } from './lib/application';

const d = debug('app:');

const app = new Application();
app.run().catch(error => {
    console.error(`Error: ${error.message}`);
    d(error.stack);
    console.log(error.stack);
    process.exit(1);
});

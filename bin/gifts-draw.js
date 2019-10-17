#!/usr/bin/env node
const main = require('../index');

const PEOPLE = [
  { name: 'John Doe', email: 'johndoe@gmail.com' },
  { name: 'Lea' },
  { name: 'Bob' },
];

main(PEOPLE, { sendEmails: true, log: false });

#!/usr/bin/env node
const fs = require('fs');
const main = require('../index');

const getMissingEmails = list => list.filter(p => !p.email);
const getMissingNames = list => list.filter(p => !p.name);

const argv = process.argv.slice(2);

function showHelp() {
  const example = {
    subject: '(string) e.g.: "Secret-santa"',
    content: '(string) e.g.: "Hey {src.name}, this year you will make a gift to {dest.name} (email: {dest.email})"',
    from: 'no-reply@example.com',
    sendMail: '(boolean): Send emails to each participants (require the SENDGRID_API_KEY)',
    logToStdout: '(boolean): Whether to log to stdout results (disable per default if --send)',
    people: [
      { name: 'John', email: 'john@example.com' },
      { name: 'Marc', email: 'marc@example.com' },
      { name: 'Lea', email: 'lea@example.com' },
      { name: 'Ann', email: 'ann@example.com' },
    ],
  };

  console.log('Usage: gifts-draw <file>');
  console.log('File example:');
  console.log(JSON.stringify(example, null, 4));
}

if (argv.includes('-h') || argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

const [filename] = argv;
if (!filename) {
  console.error('<file> is required');
  showHelp();
  process.exit(1);
}

let file;
try {
  file = fs.readFileSync(filename, 'utf8');
} catch (e) {
  if (e.code === 'ENOENT') {
    console.error(e.message);
    process.exit(1);
  }
}

let config;
try {
  config = JSON.parse(file);
} catch {
  console.error(`<file> (${filename}) is not a JSON file`);
  process.exit(1);
}

if (!config.subject || !config.content || !config.people) {
  console.error(`<file> (${filename}) is missing required props (subject, content, people)`);
  showHelp();
  process.exit(1);
}

const { people, content, subject, sendEmails = false, logToStdout = !sendEmails, from } = config;

const missingNames = getMissingNames(people);
if (missingNames.length) {
  console.error('Some lines are missing names', missingNames);
  process.exit(1);
}

if (sendEmails) {
  const missingEmails = getMissingEmails(people);
  if (missingEmails.length) {
    console.error('Some lines are missing emails');
    missingEmails.forEach(({ name }) => console.log(`\t- ${name}`));
    process.exit(1);
  }

  if (!process.env.SENDGRID_API_KEY) {
    console.error('Missing SENDGRID_API_KEY env variable');
    process.exit(1);
  }
}

main(people, { sendEmails, log: logToStdout, subject, content, from }).catch(e => console.error(e));

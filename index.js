require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const get = (obj, path, defaultValue) => path.split('.')
  .reduce((acc, part) => acc ? acc[part] : undefined, obj) || defaultValue;

/**
 *
 * @param list
 * @param subject
 * @param content
 * @param from
 * @returns {*}
 */
function createEmails(list, {
  subject,
  content,
  from = 'no-reply@example.com',
}) {
  const INTERPOLATION_TOKEN = /{\s*([.\w]+)\s*}/g;
  return list.map(([src, dest]) => ({
    to: src.email,
    from,
    subject: subject.replace(INTERPOLATION_TOKEN, (_, p) => get({ src, dest }, p)),
    text: content.replace(INTERPOLATION_TOKEN, (_, p) => get({ src, dest }, p)),
  }));
}

/**
 * Return a new list shuffled.
 *
 * @param originalList {Array<Object>}
 * @return {*}
 */
function shuffleList(originalList) {
  const newList = [...originalList];
  for (let i = newList.length - 1; i > 0; i--) {
    const rand = Math.floor(Math.random() * (i + 1));
    [newList[i], newList[rand]] = [newList[rand], newList[i]];
  }
  return newList;
}

/**
 * Return pairs.
 *
 * @param list {Array<Object>}
 */
function createDirectedPairs(list) {
  return list.map((p, i, arr) => [p, arr[i + 1] || arr[0]]);
}

/**
 * console.log Pairs
 *
 * @param pairs {Array<Object>}
 */
function logPairs(pairs) {
  pairs
    .map(([src, dest]) => `${src.name} offre à ${dest.name}`)
    .forEach(str => console.log(str));
}

async function main(list, { sendEmails = false, log = false }) {
  const shuffled = shuffleList(PEOPLE);
  const pairs = createDirectedPairs(shuffled);

  if (log) {
    logPairs(pairs);
  }

  if (sendEmails) {
    const emails = createEmails(pairs, {
      subject: 'Test cadeau',
      content: 'Salut {src.name} Tu devras faire un cadeau à {dest.name} (mail: {dest.email})',
    });
    console.log(emails);
    // await sgMail.send(emails);
  }
}

module.exports = main;

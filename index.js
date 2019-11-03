require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const get = (obj, path, defaultValue) => {
  const res = path.split('.')
    .reduce((acc, part) => acc ? acc[part] : acc, obj);
  return res === undefined ? defaultValue : res;
};

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
 * Take a list and separate couples.
 *
 * @param list {Array<Object>} Original list
 * @param rules {Array<Array<string>>} Array of pairs (with name as Id)
 */
function resolveCouples(list, rules) {
  const newList = [...list];

  for (const [couple1, couple2] of rules) {
    const idx1 = list.findIndex(({ name }) => name === couple1);
    const idx2 = list.findIndex(({ name }) => name === couple2);

    if (idx1 === -1 || idx2 === -1) {
      throw new Error(`Unable to find couple (${couple1}, ${couple2})`);
    }

    if (Math.abs(idx1 - idx2) === 1) {
      const idxMax = Math.max(idx1, idx2);
      const idxDest = idxMax === (list.length - 1) ? 0 : idxMax + 1;
      [newList[idxMax], newList[idxDest]] = [newList[idxDest], newList[idxMax]];
    }

    if (Math.abs(idx1 - idx2) === (list.length - 1)) {
      [newList[0], newList[1]] = [newList[1], newList[0]];
    }
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

async function main(list, { sendEmails = false, log = false, subject, content, from, rules }) {
  let shuffled = shuffleList(list);

  if (rules) {
    shuffled = resolveCouples(shuffled, rules);
  }

  const pairs = createDirectedPairs(shuffled);

  if (log) {
    logPairs(pairs);
  }

  if (sendEmails) {
    const emails = createEmails(pairs, { subject, content });
    await sgMail.send(emails);
  }
}

module.exports = main;
module.exports.__TESTS__ = {
  get,
  createEmails,
  shuffleList,
  createDirectedPairs,
  resolveCouples,
};

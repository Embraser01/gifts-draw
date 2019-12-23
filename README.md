# santagifts

This project can generate pairs for a secret santa and send emails to each participants.

## Example

Just run:
```bash
yarn dlx santagifts config.json
```

With `config.json`
```json5
{
  "subject": "Secret-santa",
  "content": "Hey {src.name}, this year you will make a gift to {dest.name} (email: {dest.email})",
  "sendEmails": true,
  "logToStdout": false,
  "people": [
    {
      "name": "John",
      "email": "john@example.com"
    },
    {
      "name": "Marc",
      "email": "marc@example.com"
    },
    {
      "name": "Lea",
      "email": "lea@example.com"
    },
    {
      "name": "Ann",
      "email": "ann@example.com"
    }
  ],
  // Exclusions prevent people from receiving/sending other people
  "exclusions": [
    // Here, John, Lea and Ann will never pick each others
    ["John", "Lea", "Ann"]
  ],
  // Rules is a simpler system where you prevent someone to pick someone else
  "rules": [
    // Here, Marc will never pick Lea
    ["Marc", "Lea"]
  ]
}
```

## Sendgrid

Emails are sent through [sendgrid](https://sendgrid.com). You'll need a `SENDGRID_API_KEY`
environnement variable to send mails.

> You can set this env variable through a `.env` file in your working directory

# Email Processor

TODO:

- [x] Create SQS queue FIFO.
- [x] Get Attachments with processEmail lambda and send one SQS for each line.
  - [ ] Deal with more than one Attachment per email
- [x] Create a Database (PostgreSQL or DynamoDB).
  - [x] PostgreSQL
- [x] Create a second lambda to read one SQS message
  - [ ] and save line formatted into Database, if the last line, return an email with processing success.

## This Serverless app should do:

1. Receive email with attachment.
2. Store attachment into S3 bucket.
3. Trigger a lambda to send a SQS message for each line of attachment.
4. Another lambda read a message with one line and save into Database.
5. Return email with a success process or error message.

## Email and Domain Validation

### If you dont have a domain

> Will cost $4/month after first month: https://aws.amazon.com/workmail/pricing/

1. First of all, you need a domain to receive e-mails through Amazon SES, thanks to Amazon Workmail we can create a test domain like _[newdomain].awsapps.com._
2. In [Amazon Workmail](https://us-east-1.console.aws.amazon.com/workmail/v2/home) create an organization and select "free test domain" with an alias you like and wait creation end.
3. Click on that created organization and **Add New User** with the email and password that you will use later.
4. After that, go to [Amazon SES](https://us-east-1.console.aws.amazon.com/ses/home), click on Identities on left, you should see your new domain with status **verified**, you will also need an email identity.
5. To do that, create a new Identity and enter email address you created earlier.
6. Login on Amazon Webmail **_https://[your-domain].awsapps.com/mail_** and confirm clicking validation link.
7. Go back into Amazon SES and check if status is **verified**.

### If you have a domain

1. Create and validate Domain identity in SES.
2. Configure [Amazon MX record](https://docs.aws.amazon.com/ses/latest/dg/receiving-email-mx-record.html) on your domain to receive e-mail (edit old existing MX, or set lowest priority value for new).
3. After last step, all emails will be sent to amazon and not to your existing one, then you will need to configure an forwarding.

### Project Setup

Now we can go to project and make some changes on env file.

1. First change _env.example.yml_ to _env.yml_.
2. Set _BucketName_, _BucketRef_ and your aws domain on _TEST_DOMAIN_
3. We don't have a external domain yet, so you can repeat test domain on _PERSONAL_DOMAIN_.
4. Run the code

```bash
sls deploy
```

1. Go to Amazon SES in _Email Receiving_ and activate the _myRuleSet_ created by definition on serverless.yml.
2. Send an email to your Amazon Workmail (or anything@yourdomain.com if using personal domain) created earlier and view the email content in logs with:

```bash
sls logs --function processEmail
sls logs --function processQueue
```

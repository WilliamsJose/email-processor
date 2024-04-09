# Email Processor

TODO: 
- [x] Create SQS queue FIFO.
- [ ] Get Attachments with processEmail lambda and send one SQS for each line.
- [x] Create a Database (PostgreSQL or DynamoDB).
  - [x] PostgreSQL
- [x] Create a second lambda to read one SQS message 
  - [ ] and save line formatted into Database, if the last line, return an email with processing success.
- [ ] Integrate with Amazon Workmail to view emails and not only save on bucket.


## This Serverless app should do:

1. Receive email with attachment.
2. Store attachment into S3 bucket.
3. Trigger a lambda to send a SQS message for each line of attachment.
4. Another lambda read a message with one line and save into Database.
5. Return email with a success process or error message.

## How to setup

### Email and Domain Validation

1. First of all, you need a domain to receive e-mails through Amazon SES, thanks to Amazon Workmail we can create a test domain like *[newdomain].awsapps.com.*
2. In [Amazon Workmail](https://us-east-1.console.aws.amazon.com/workmail/v2/home) create an organization and select "free test domain" with an alias you like and wait creation end.
3. Click on that created organization and **Add New User** with the email and password that you will use later.
4. After that, go to [Amazon SES](https://us-east-1.console.aws.amazon.com/ses/home), click on Identities on left, you should see your new domain with status **verified**, you will also need an email identity.
5. To do that, create a new Identity and enter email address you created earlier.
6. Login on Amazon Webmail ***https://[your-domain].awsapps.com/mail*** and confirm clicking validation link.
7. Go back into Amazon SES and check if status is **verified**.

### Project Setup
Now we cann go to project and make some changes on env file.

1. First change *env.example.yml* to *env.yml*.
2. Set *BucketName*, *BucketRef* and your aws domain on *TEST_DOMAIN*
3. We don't have a external domain yet, so you can repeat test domain on *PERSONAL_DOMAIN*.
4. Run the code
```bash
sls deploy
```
1. Go to Amazon SES in *Email Receiving* and activate the *myRuleSet* created by definition on serverless.yml.
2. Send an email to your Amazon Workmail created earlier and view the email content in logs with:
```bash
sls logs --function processEmail
```



### If you have a domain



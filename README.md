# Email Processor

This Serverless app should do FIFO:

1. Receive email with attachment.
2. Store attachment into S3 bucket.
3. Trigger a lambda to send a SQS message for each line of attachment.
4. Another lambda read a message with one line and save into Database.
5. Return email with a success process or error message.

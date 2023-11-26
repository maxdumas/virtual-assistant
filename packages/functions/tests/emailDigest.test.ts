import { join } from 'node:path';
import { createReadStream } from 'node:fs';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const s3Mock = mockClient(S3Client);

const mockEvent = {
  Records: [
    {
      messageId: '',
      receiptHandle: '',
      attributes: {} as any,
      messageAttributes: {} as any,
      md5OfBody: {} as any,
      eventSource: {} as any,
      eventSourceARN: {} as any,
      awsRegion: 'us-east-1',
      body: JSON.stringify({
        Message: JSON.stringify({
          notificationType: 'Received',
          mail: {
            timestamp: '2023-11-26T17:45:49.412Z',
            source: 'maltor124@gmail.com',
            messageId: 'k88489vmck45oc0fbhesk66ursv8s3bqki2hea81',
            destination: [
              'events@va.dumas.nyc',
            ],
            headersTruncated: false,
            headers: [
              {
                name: 'Return-Path',
                value: '<maltor124@gmail.com>',
              },
              {
                name: 'Received',
                value: 'from mail-qk1-f174.google.com (mail-qk1-f174.google.com [209.85.222.174]) by inbound-smtp.us-east-1.amazonaws.com with SMTP id k88489vmck45oc0fbhesk66ursv8s3bqki2hea81 for events@va.dumas.nyc; Sun, 26 Nov 2023 17:45:49 +0000 (UTC)',
              },
              {
                name: 'Received-SPF',
                value: 'pass (spfCheck: domain of _spf.google.com designates 209.85.222.174 as permitted sender) client-ip=209.85.222.174; envelope-from=maltor124@gmail.com; helo=mail-qk1-f174.google.com;',
              },
              {
                name: 'Authentication-Results',
                value: 'amazonses.com; spf=pass (spfCheck: domain of _spf.google.com designates 209.85.222.174 as permitted sender) client-ip=209.85.222.174; envelope-from=maltor124@gmail.com; helo=mail-qk1-f174.google.com; dkim=pass header.i=@gmail.com; dmarc=pass header.from=gmail.com;',
              },
              {
                name: 'X-SES-RECEIPT',
                value: 'AEFBQUFBQUFBQUFIcU5BZkZvOUdwencwZWllZ2NYMTRjMjNBazV5UVBkVG1pZ0ZMeUNVMkVFMDRzRE1keEtkVDcrc1IwUzh6bW5BWWU1RGFWTy9pYzFpZDEzbk0yN1diRzBHa3d1SHlIMkw4SzRCeUdKNzBtbDFOZkRLbjBNbjkrTnZQWStDaUZQdWxTekdhZUZyNVVLOXNuNDllNExaZTcrcCtId0dzRXhkeVdNcFRCUUVBQThhQXNWQ2JkMVVTWXFKb3RmeUIwRGNDRzJLOUk2WS8yVEhmMzBrL1FaNDRLYzNzWmVpWW9GQWlXNGF3ZE1yMzlyZFI1c3hlRDBqMmNXckk0N1g1ZGJzek15Y2ZSSElyZWsrYmYrNWRlbHpjYm1kdlBCMm1IMGFLNXF1YlRmdE9SaHc9PQ==',
              },
              {
                name: 'X-SES-DKIM-SIGNATURE',
                value: 'a=rsa-sha256; q=dns/txt; b=itezLWYHrPZLZN2qybXTtkJXY2RVMy9+nAXtoCbmmwaRlM8Faz059SNiUrnsNlBCbtSPZaLDSzj6iYrFo3a6mWebBcve8mhFPcVCay/2qsLH/LRrSNDp42ZyJQ9h982x+f3Bd9mbQrutL6jVPbF0W+xFeU1hUb1STVegStVRQbY=; c=relaxed/simple; s=224i4yxa5dv7c2xz3womw6peuasteono; d=amazonses.com; t=1701020749; v=1; bh=QqxjETmEDyGcsNTlS59qQZlh/3UWNaRffcOHCPD+yT0=; h=From:To:Cc:Bcc:Subject:Date:Message-ID:MIME-Version:Content-Type:X-SES-RECEIPT;',
              },
              {
                name: 'Received',
                value: 'by mail-qk1-f174.google.com with SMTP id af79cd13be357-77d84f8808dso106223285a.2 for <events@va.dumas.nyc>; Sun, 26 Nov 2023 09:45:49 -0800 (PST)',
              },
              {
                name: 'DKIM-Signature',
                value: 'v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20230601; t=1701020748; x=1701625548; darn=va.dumas.nyc; h=mime-version:message-id:to:references:date:subject:from:from:to:cc:subject:date:message-id:reply-to; bh=vDZpp+BOukSlKK9uRti6EkYlzDuob91Sf6RmLGzxI4k=; b=ORa7O7/IPaJj6FBHg5BYXG4kaiXrl25r6NxuN73IDjH0nl8JcMKZj50nA9O8VhA1DNw8SB9FStpqPujIAS4VeTLrfzskC3odfVyL64SR15HohfPDwdWHaXmE49sxiQ2nlweoxiTdYgoUnS3q3wXff5zB5TMnPffOC5IQvfRIRTQtXLoGiHY+XPq6wMC+/uay4qdOicpeh55qQUUTMYajc50iJWziHP8Y/xRlSnL2uDGH+nv58YLqvoHYE/s4aE2TszqZhN7zpemFAxwjU0vsY+n4lC4jGgen18ei9HelWYlFQJgcuQZsE8txjkRXj0rxH0bZQLE5x8csLc6IC99SWA==',
              },
              {
                name: 'X-Google-DKIM-Signature',
                value: 'v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20230601; t=1701020748; x=1701625548; h=mime-version:message-id:to:references:date:subject:from :x-gm-message-state:from:to:cc:subject:date:message-id:reply-to; bh=vDZpp+BOukSlKK9uRti6EkYlzDuob91Sf6RmLGzxI4k=; b=YRZcqbjbVxqvsc6ALxA4W16QqWvuFzoCqqcGCw0c1zI+uIxKCJ1PSsveSH50iJKwyt n+btInE7SxVDcjUy8LDBMV9Aofbv8viOot91dyVaSvnQXbACinYyp3c1BeTdgQzEByT/ dZ4AKT/6UWfmrKs62nsalOYElNkZIue2THfaanXUTgPMKfBsaFv+G2asTlUl0uFSenxB umRMqgaO0/0upSyCwJXYRFHLlSydmyFx9U3H/pxo4Njs9PHMA+dw1/ZmYf4jR9JNY2bV BtoWWXk3AiPRZEU8d75gAZTW+J3DN9xKPTRVCqxJYl42sSnESAKBu/WraUMGNOeV8a1X bfXg==',
              },
              {
                name: 'X-Gm-Message-State',
                value: 'AOJu0YyttaVSp2AVXDIi0YCH++d3d24x27WztyJcvlVuH8a+AGYxCEVd itLMhh3jRNfm8H+nmtSu4ezyjAABok0=',
              },
              {
                name: 'X-Google-Smtp-Source',
                value: 'AGHT+IEuDk19UYAZqnUsa700cxFDlBdjL5+6mvtPUjmKXoE7dny1ixFKoxsdDDl4aJdX3eN90dx8iQ==',
              },
              {
                name: 'X-Received',
                value: 'by 2002:a05:620a:8f01:b0:76f:1eac:e72d with SMTP id rh1-20020a05620a8f0100b0076f1eace72dmr8458402qkn.38.1701020747054; Sun, 26 Nov 2023 09:45:47 -0800 (PST)',
              },
              {
                name: 'Return-Path',
                value: '<maltor124@gmail.com>',
              },
              {
                name: 'Received',
                value: 'from smtpclient.apple ([2a09:bac5:a6f3:6e::b:243]) by smtp.gmail.com with ESMTPSA id j2-20020a05620a410200b0077d7326c60csm3072951qko.38.2023.11.26.09.45.46 for <events@va.dumas.nyc> (version=TLS1_2 cipher=ECDHE-ECDSA-AES128-GCM-SHA256 bits=128/128); Sun, 26 Nov 2023 09:45:46 -0800 (PST)',
              },
              {
                name: 'From',
                value: 'Max Dumas <maltor124@gmail.com>',
              },
              {
                name: 'X-Google-Original-From',
                value: 'Max Dumas <max@dumas.nyc>',
              },
              {
                name: 'Content-Type',
                value: 'multipart/alternative; boundary="Apple-Mail=_0547E371-F069-457F-9D51-476DB5D8ACEE"',
              },
              {
                name: 'X-Priority',
                value: '3',
              },
              {
                name: 'Subject',
                value: 'Fwd: nonsense: 11.24 to 11.30',
              },
              {
                name: 'Date',
                value: 'Sun, 26 Nov 2023 12:45:35 -0500',
              },
              {
                name: 'References',
                value: '<0101018c02801c5c-459b31e0-0c51-4243-943a-a812ef772918-000000@us-west-2.amazonses.com>',
              },
              {
                name: 'To',
                value: 'events@va.dumas.nyc',
              },
              {
                name: 'Message-Id',
                value: '<7A414BAB-25C9-431E-B92C-3B303AC0A076@dumas.nyc>',
              },
              {
                name: 'Mime-Version',
                value: '1.0 (Mac OS X Mail 16.0 \\(3774.200.91.1.1\\))',
              },
              {
                name: 'X-Mailer',
                value: 'Apple Mail (2.3774.200.91.1.1)',
              },
            ],
            commonHeaders: {
              returnPath: 'maltor124@gmail.com',
              from: [
                'Max Dumas <maltor124@gmail.com>',
              ],
              date: 'Sun, 26 Nov 2023 12:45:35 -0500',
              to: [
                'events@va.dumas.nyc',
              ],
              messageId: '<7A414BAB-25C9-431E-B92C-3B303AC0A076@dumas.nyc>',
              subject: 'Fwd: nonsense: 11.24 to 11.30',
            },
          },
          receipt: {
            timestamp: '2023-11-26T17:45:49.412Z',
            processingTimeMillis: 411,
            recipients: [
              'events@va.dumas.nyc',
            ],
            spamVerdict: {
              status: 'DISABLED',
            },
            virusVerdict: {
              status: 'DISABLED',
            },
            spfVerdict: {
              status: 'PASS',
            },
            dkimVerdict: {
              status: 'PASS',
            },
            dmarcVerdict: {
              status: 'PASS',
            },
            action: {
              type: 'S3',
              topicArn: 'arn:aws:sns:us-east-1:353161589245:VirtualAssistant-EmailReceiptTopicE401841F-NiXxv4wMScYv',
              bucketName: 'virtualassistant-emailstoragebucket61c70ce5-8fhnbydqmh43',
              objectKey: 'k88489vmck45oc0fbhesk66ursv8s3bqki2hea81',
            },
          },
        }),
      }),
    },
  ],
};

describe('emailDigest lambda', async () => {
  describe('handler', () => {
    beforeEach(() => {
      s3Mock.reset();
    });

    it('works', async () => {
      s3Mock.on(GetObjectCommand).resolves({
        Body: createReadStream(new URL('./fixtures/sample_email.txt', import.meta.url)) as any,
      });

      const { handler } = await import('../src/emailDigest');
      const result = await handler(mockEvent);
      expect(result.status).toEqual(200);
      expect(await result.text()).toContain('here\'s a link to support nonsense all year long');
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});

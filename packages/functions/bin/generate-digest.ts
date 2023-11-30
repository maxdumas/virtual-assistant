import { handler } from '../src/emailDigest';

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
            timestamp: '2023-11-30T00:55:58.359Z',
            source: 'maltor124@gmail.com',
            messageId: 's1to6rtpigvkiq4tv25hf2dffme2pfmcdqu2s401',
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
                value: 'from mail-qt1-f193.google.com (mail-qt1-f193.google.com [209.85.160.193]) by inbound-smtp.us-east-1.amazonaws.com with SMTP id s1to6rtpigvkiq4tv25hf2dffme2pfmcdqu2s401 for events@va.dumas.nyc; Thu, 30 Nov 2023 00:55:58 +0000 (UTC)',
              },
              {
                name: 'Received-SPF',
                value: 'pass (spfCheck: domain of _spf.google.com designates 209.85.160.193 as permitted sender) client-ip=209.85.160.193; envelope-from=maltor124@gmail.com; helo=mail-qt1-f193.google.com;',
              },
              {
                name: 'Authentication-Results',
                value: 'amazonses.com; spf=pass (spfCheck: domain of _spf.google.com designates 209.85.160.193 as permitted sender) client-ip=209.85.160.193; envelope-from=maltor124@gmail.com; helo=mail-qt1-f193.google.com; dkim=pass header.i=@gmail.com; dmarc=pass header.from=gmail.com;',
              },
              {
                name: 'X-SES-RECEIPT',
                value: 'AEFBQUFBQUFBQUFGY3BVR0FHdUppVkNIYzdkMVFSYVFrSzhpbmxySHY2Tk9kTmd0SnVlSThRK2pZcHZkblhGaitYSDhyZzNXV09UVU5jbVE4cWk0OVRBVkt5T2NwR2g5ZXVuN0ZZZVp4aVlwdnZPR3UrMGRaZkNvR3Q3U3A3aS9VSDY1NW0yWnZiMDdLbUtlcUduNU90bTBxWk5TeFNmR2FwZDFQbnJTODhTRXA0SzZaenBGUzZLNXNGbDlGTDNSUVhET25HWFhYY0t3TmF4eFhmaG43QjFKWHU0VUZNaDRwZWV1NFQyVlRDWWg0aTR6WXJheFh6SjAwTlZXZGlBU25Oc3RNWmIyaU55RGRvbll3YTJkNGdOaTNidEplaDlNZFpHUTk2UThVM2xERHQwL21tY2VDOGc9PQ==',
              },
              {
                name: 'X-SES-DKIM-SIGNATURE',
                value: 'a=rsa-sha256; q=dns/txt; b=XJR1jDRHIQMw7onMy26l9Fyb5k0QMfsAW68Z/QE9yCuf/Z4vAcXQBpxj0Mdkaz+5K7cZaOJTxdcnrTQ1vUI4GqRPuGIP2OO7zwXv4KLxp7w4ARhL2CKUpmKSiJi9ZbPmciS9MPx68x+32nEX3Dql9MSnTd8ZRFdvHYCYBpiMDA8=; c=relaxed/simple; s=224i4yxa5dv7c2xz3womw6peuasteono; d=amazonses.com; t=1701305758; v=1; bh=Zzy+k+Dggp5TmeY1KOk/InKhGLRs6zDxPc+iZHxq0AI=; h=From:To:Cc:Bcc:Subject:Date:Message-ID:MIME-Version:Content-Type:X-SES-RECEIPT;',
              },
              {
                name: 'Received',
                value: 'by mail-qt1-f193.google.com with SMTP id d75a77b69052e-423ec1b2982so2438571cf.2 for <events@va.dumas.nyc>; Wed, 29 Nov 2023 16:55:58 -0800 (PST)',
              },
              {
                name: 'DKIM-Signature',
                value: 'v=1; a=rsa-sha256; c=relaxed/relaxed; d=gmail.com; s=20230601; t=1701305757; x=1701910557; darn=va.dumas.nyc; h=date:to:references:message-id:subject:mime-version:from:from:to:cc:subject:date:message-id:reply-to; bh=OVC/tsvNvFFdkDmFuhYln3O7sWq342Y5S5QLySB5S3I=; b=BLwPticbOd78BuLRTzu8awrZUAu0j5mMNtxmfZGHwFBG4LP2tc4X7GPTyiH92bUTwD7bnoy8m703EAinZ5dfRQa4x5OyoD8c/Xkce2z3aEDXMxMQ9U7G62x8XTY0HlPtvHObsMjTbyFPYyDZSuMJ3APL+lj6wrCkzUgS4nzm5ITHxUNIhgmM5TvsH3H9QoZZ6J2w6+N4pYiD6/c5dbb05QEv2c9jdO203BYH+6PjfZNsp5Hrc1kHgbl+b4IGDMiuO2UpNd1nHKBqMoynP9O0XDVnpfCN4htQAjX2S500bySV4K9Mwshmtw+uqXtB7yapYjpj8l4UpcvuMMmej40E3A==',
              },
              {
                name: 'X-Google-DKIM-Signature',
                value: 'v=1; a=rsa-sha256; c=relaxed/relaxed; d=1e100.net; s=20230601; t=1701305757; x=1701910557; h=date:to:references:message-id:subject:mime-version:from :x-gm-message-state:from:to:cc:subject:date:message-id:reply-to; bh=OVC/tsvNvFFdkDmFuhYln3O7sWq342Y5S5QLySB5S3I=; b=cCzai8hzJ4TpyUd+vxR21ZfvRPot9bUlcX8/81E5aGr0fsifpPYlis0Rsutevjerxg Ism2LNYUoq+dCIcdKxpYL9SYFMdGBP7iv+p3O96aGs5oFdYIMseveOMXmBtCTuxed1N+ Ybf/FOB1mAqAuSLV5lWQJIZocnvK7f4LUmZh0pQVQUF4pWtMZfCDKzE9U7oeeeiB3nCn spRQ+80HQipgRDcwe0l/xKWatKA7Ma4/iEkDgENtY0obLeXpk9CWSLoMBRSz637jVktD YYD69Bz7skaZfiFykrLhjc7Q2vqtxUZwEBpjW7o8Oor1fWME8+5EW8QNCn5l6HPZT/zr OrYg==',
              },
              {
                name: 'X-Gm-Message-State',
                value: 'AOJu0Ywzh3CPSH7iG5l5ZBNpBXCxtMpFCkq3oZ8W6FdFZI/MA/URK1HK 6/BkbX/vvjUxVKt9TGkhvIViN3EipQeIyg==',
              },
              {
                name: 'X-Google-Smtp-Source',
                value: 'AGHT+IGRA5/xuPL3i4NiWY+kFi0eFqDFkWwe9OBL4vpHDuGbvYLlTFeSxHGfSc/ptBgYFxG5nnIh2g==',
              },
              {
                name: 'X-Received',
                value: 'by 2002:ac8:5a51:0:b0:423:74e1:12c0 with SMTP id o17-20020ac85a51000000b0042374e112c0mr24356229qta.61.1701305757197; Wed, 29 Nov 2023 16:55:57 -0800 (PST)',
              },
              {
                name: 'Return-Path',
                value: '<maltor124@gmail.com>',
              },
              {
                name: 'Received',
                value: 'from smtpclient.apple ([2a09:bac1:76c0:518::b:134]) by smtp.gmail.com with ESMTPSA id jr27-20020a05622a801b00b00410a9dd3d88sm2051qtb.68.2023.11.29.16.55.56 for <events@va.dumas.nyc> (version=TLS1_2 cipher=ECDHE-ECDSA-AES128-GCM-SHA256 bits=128/128); Wed, 29 Nov 2023 16:55:56 -0800 (PST)',
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
                value: 'multipart/alternative; boundary="Apple-Mail=_BD1E37A5-E049-4DA1-8AFA-17BC25814CC4"',
              },
              {
                name: 'Mime-Version',
                value: '1.0 (Mac OS X Mail 16.0 \\(3774.200.91.1.1\\))',
              },
              {
                name: 'Subject',
                value: '=?utf-8?Q?Fwd=3A_The_Joy_List=3A_Prophecy_+_Oddity_=F0=9F=8C=9D?=',
              },
              {
                name: 'Message-Id',
                value: '<EE88C8DB-7CC1-4FEC-A228-1960E6C5E370@dumas.nyc>',
              },
              {
                name: 'References',
                value: '<11dd5bb5b9ad002b5cd296e00.fcee5880ae.20231128004855.a50332992d.a039ffaf@mail116.suw231.rsgsv.net>',
              },
              {
                name: 'To',
                value: 'events@va.dumas.nyc',
              },
              {
                name: 'Date',
                value: 'Wed, 29 Nov 2023 19:55:46 -0500',
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
              date: 'Wed, 29 Nov 2023 19:55:46 -0500',
              to: [
                'events@va.dumas.nyc',
              ],
              messageId: '<EE88C8DB-7CC1-4FEC-A228-1960E6C5E370@dumas.nyc>',
              subject: 'Fwd: The Joy List: Prophecy + Oddity 🌝',
            },
          },
          receipt: {
            timestamp: '2023-11-30T00:55:58.359Z',
            processingTimeMillis: 510,
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
              objectKey: 's1to6rtpigvkiq4tv25hf2dffme2pfmcdqu2s401',
            },
          },
        }),
      }),
    },
  ],
};

console.log(await handler(mockEvent));

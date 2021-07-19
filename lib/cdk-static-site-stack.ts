import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as acm from '@aws-cdk/aws-certificatemanager';

export class CdkStaticSiteStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const destinationBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const domainName = 'static.cdk.clarence.tw'
    const hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: 'cdk.clarence.tw'
    });
    const certificate = new acm.DnsValidatedCertificate(this, 'CrossRegionCertificate', {
      domainName,
      hostedZone,
      region: 'us-east-1',
    });
    const cloudfrontTarget = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: { origin: new origins.S3Origin(destinationBucket) },
      domainNames: [domainName],
      certificate,
    });

    new route53.ARecord(this, 'DomainARecord', {
      recordName: domainName,
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cloudfrontTarget))
    });
    new cdk.CfnOutput(this, 'DomainName', {
      value: `https://${domainName}`
    })

    new s3deploy.BucketDeployment(this, 'HTMLBucketDeployment', {
      sources: [s3deploy.Source.asset('./website')],
      destinationBucket,
      cacheControl: [s3deploy.CacheControl.fromString('no-store, max-age=0')],
      prune: true,
    });
    new cdk.CfnOutput(this, 'bucketWebsiteUrl', {
      value: destinationBucket.bucketWebsiteUrl
    })
  }
}

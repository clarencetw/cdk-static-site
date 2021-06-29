import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';

export class CdkStaticSiteStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const destinationBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

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
